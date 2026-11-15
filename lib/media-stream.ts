import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable, type Writable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { SocialDownloadMode, SocialPlatformId } from "@/data/social-platforms";
import { resolveYtDlp, runYtDlp } from "@/lib/yt-dlp";
import {
  readInfo,
  resolveMediaUrl,
  resolveWebsiteMediaUrl,
  UserFacingError,
  validateWebsiteUrl,
  type DownloadQuality,
  type YtDlpFormat,
  type YtDlpInfo,
} from "@/lib/social-media";

/*
 * Streams media to the user's browser as it arrives from the platform. Nothing
 * is written to disk: bytes are relayed (and, when the platform serves picture
 * and sound separately, joined on the fly by ffmpeg) straight into the response.
 */

export type MediaDownload = {
  stream: Readable;
  filename: string;
  contentType: string;
  size?: number;
};

const contentTypes: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  m4a: "audio/mp4",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  ogg: "audio/ogg",
  opus: "audio/opus",
  png: "image/png",
  webm: "video/webm",
  webp: "image/webp",
};

const cookieAttributes = new Set([
  "domain",
  "path",
  "expires",
  "max-age",
  "secure",
  "httponly",
  "samesite",
  "priority",
  "partitioned",
]);

function ffmpegPath() {
  return (
    process.env.FFMPEG_PATH ||
    path.join(
      process.cwd(),
      "node_modules",
      "ffmpeg-static",
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg",
    )
  );
}

function isHttp(format: YtDlpFormat) {
  return !format.protocol || format.protocol === "https" || format.protocol === "http";
}

function isHls(format: YtDlpFormat) {
  return format.protocol === "m3u8" || format.protocol === "m3u8_native";
}

function safeFilename(title: string | undefined, extension: string) {
  const base =
    (title ?? "")
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/gu, "_")
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, 120) || "download";
  return `${base}.${extension}`;
}

function requestHeaders(format: YtDlpFormat) {
  const headers: Record<string, string> = { ...(format.http_headers ?? {}) };
  const cookie = format.cookies
    ?.split(";")
    .map((part) => part.trim())
    .filter((part) => part.includes("=") && !cookieAttributes.has(part.split("=")[0].trim().toLowerCase()))
    .join("; ");
  if (cookie) headers.Cookie = cookie;
  headers["Accept-Encoding"] = "identity";
  return headers;
}

async function checkedUrl(format: YtDlpFormat) {
  const url = await validateWebsiteUrl(format.url);
  if (!url) throw new Error("The platform returned a media address that cannot be used.");
  return url;
}

/**
 * Opens an HTTP media URL. When yt-dlp says the host needs ranged requests
 * (YouTube throttles large single requests), the body is fetched in chunks.
 */
async function openHttpSource(format: YtDlpFormat, signal: AbortSignal) {
  const url = await checkedUrl(format);
  const headers = requestHeaders(format);
  const chunkSize = format.downloader_options?.http_chunk_size;

  const request = async (start?: number) => {
    const response = await fetch(url, {
      headers:
        chunkSize && start !== undefined
          ? { ...headers, Range: `bytes=${start}-${start + chunkSize - 1}` }
          : headers,
      redirect: "follow",
      signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(`The media server responded with HTTP ${response.status}.`);
    }
    return response;
  };

  const first = await request(chunkSize ? 0 : undefined);
  const totalFromRange = Number(first.headers.get("content-range")?.match(/\/(\d+)\s*$/u)?.[1]);
  const total =
    totalFromRange ||
    (first.status === 200 ? Number(first.headers.get("content-length")) || undefined : undefined);

  async function* body() {
    let response = first;
    let position = 0;
    while (true) {
      let received = 0;
      for await (const chunk of Readable.fromWeb(response.body as unknown as WebReadableStream)) {
        received += (chunk as Buffer).length;
        yield chunk as Buffer;
      }
      position += received;
      const finished =
        response.status !== 206 ||
        !chunkSize ||
        received === 0 ||
        (total !== undefined ? position >= total : received < chunkSize);
      if (finished) return;
      response = await request(position);
    }
  }

  return { stream: Readable.from(body(), { objectMode: false }), size: total };
}

function headerArgs(format: YtDlpFormat) {
  const headers = requestHeaders(format);
  delete headers["Accept-Encoding"];
  const lines = Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}\r\n`)
    .join("");
  return lines ? ["-headers", lines] : [];
}

type FfmpegInput = { format: YtDlpFormat; source?: Readable; url?: string };

function runFfmpeg(inputs: FfmpegInput[], outputArgs: string[], abort: AbortController) {
  const args = ["-hide_banner", "-loglevel", "error", "-nostdin"];
  let pipeNumber = 3;
  for (const input of inputs) {
    if (input.source) {
      args.push("-i", `pipe:${pipeNumber}`);
      pipeNumber += 1;
    } else {
      args.push(...headerArgs(input.format), "-i", input.url!);
    }
  }
  args.push(...outputArgs, "pipe:1");

  const piped = inputs.filter((input) => input.source);
  const child = spawn(/*turbopackIgnore: true*/ ffmpegPath(), args, {
    stdio: ["ignore", "pipe", "pipe", ...piped.map(() => "pipe" as const)],
    windowsHide: true,
  });

  const stdout = child.stdout as Readable;
  const stderrStream = child.stderr as Readable;

  piped.forEach((input, position) => {
    const target = child.stdio[3 + position] as Writable;
    target.on("error", () => {});
    input.source!.on("error", (error) => {
      console.error("Media source stream failed.", error);
      child.kill("SIGKILL");
    });
    input.source!.pipe(target);
  });

  let stderr = "";
  stderrStream.on("data", (chunk: Buffer) => {
    stderr = `${stderr}${chunk.toString()}`.slice(-4000);
  });
  child.on("error", (error) => {
    console.error("Could not start ffmpeg.", error);
    stdout.destroy(error);
  });
  child.on("close", (code) => {
    for (const input of piped) input.source!.destroy();
    if (code !== 0 && !abort.signal.aborted) {
      console.error(`ffmpeg exited with code ${code}.`, stderr);
      stdout.destroy(new Error("The media could not be converted."));
    }
  });
  abort.signal.addEventListener("abort", () => child.kill("SIGKILL"), { once: true });
  return stdout;
}

/** Has yt-dlp fetch one format (from a saved lookup) and stream it to stdout. */
function ytDlpSource(binary: string, infoPath: string, formatId: string, abort: AbortController) {
  const child = runYtDlp(binary, [
    "--load-info-json",
    infoPath,
    "--format",
    formatId,
    "--no-warnings",
    "--quiet",
    "--no-progress",
    "--no-part",
    "--output",
    "-",
  ]);
  const stdout = child.stdout as Readable;
  child.catch((error: unknown) => {
    if (abort.signal.aborted) return;
    console.error("yt-dlp could not stream a download.", error);
    stdout.destroy(new Error("The download stopped early."));
  });
  abort.signal.addEventListener("abort", () => child.kill(), { once: true });
  return stdout;
}

function formatSelector(quality: DownloadQuality) {
  if (quality === "mp3") return "ba[ext=m4a]/ba/b";
  if (quality === "m4a") return "ba[ext=m4a]/ba";
  if (quality.startsWith("h")) {
    const height = Number(quality.slice(1));
    // Exactly the chosen height, preferring H.264 (plays on every device), else
    // the closest lower one.
    return [
      `bv*[height=${height}][ext=mp4][vcodec^=avc1]+ba[ext=m4a]`,
      `b[height=${height}][vcodec~='^(avc|h264)']`,
      `bv*[height=${height}][ext=mp4]+ba[ext=m4a]`,
      `bv*[height=${height}]+ba`,
      `b[height=${height}]`,
      `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]`,
      `bv*[height<=${height}]+ba`,
      `b[height<=${height}]`,
      "b",
    ].join("/");
  }
  // Best quality, but a single file in the widely playable H.264 format wins
  // over an equal one in a newer format some devices can't play.
  return "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4][vcodec~='^(avc|h264)']/b[ext=mp4]/bv*+ba/b";
}

/**
 * Starts streaming one item. Resolves once the first bytes are on their way, so
 * the caller can send headers immediately.
 */
export async function openMediaDownload({
  platform,
  mode,
  url,
  index,
  quality: requestedQuality,
  signal,
}: {
  platform: SocialPlatformId;
  mode: SocialDownloadMode;
  url: string;
  index?: number;
  quality?: DownloadQuality;
  signal: AbortSignal;
}): Promise<MediaDownload> {
  const quality: DownloadQuality =
    requestedQuality ?? (platform === "youtube" && mode === "audio" ? "mp3" : "best");
  const abort = new AbortController();
  if (signal.aborted) abort.abort();
  signal.addEventListener("abort", () => abort.abort(), { once: true });

  try {
    const target =
      platform === "website" ? await resolveWebsiteMediaUrl(url) : { url: await resolveMediaUrl(url) };

    let info: YtDlpInfo;
    if (target.title) {
      info = { url: target.url, protocol: "m3u8_native", ext: "mp4", title: target.title.replace(/_/gu, " ") };
    } else {
      info = await readInfo(target.url, [
        "--format",
        formatSelector(quality),
        ...(index ? ["--yes-playlist", "--playlist-items", String(index)] : ["--no-playlist"]),
      ]);
      if (info._type === "playlist") {
        const entry = info.entries?.find((candidate): candidate is YtDlpInfo => Boolean(candidate));
        if (!entry) throw new UserFacingError("We couldn't find a video or photo at this link.");
        info = entry;
      }
    }

    const formats = info.requested_formats?.length ? info.requested_formats : [info];
    const wantsMp3 = quality === "mp3";

    // YouTube files are fetched directly (fast, with a known size). Other sites
    // (TikTok, Instagram, …) only serve their files to yt-dlp's own requests, so
    // yt-dlp fetches each part and streams it on, reusing the lookup above.
    const viaYtDlp = platform !== "youtube" && !target.title;
    let sourceFor: (format: YtDlpFormat) => Promise<{ stream: Readable; size?: number }>;
    if (viaYtDlp) {
      const binary = await resolveYtDlp();
      const infoPath = path.join(os.tmpdir(), `trovflex-info-${randomUUID()}.json`);
      await writeFile(infoPath, JSON.stringify(info), "utf8");
      // Only the small lookup file is written; it is removed as soon as the download ends.
      abort.signal.addEventListener("abort", () => void rm(infoPath, { force: true }), { once: true });
      sourceFor = async (format) => ({
        stream: ytDlpSource(binary, infoPath, format.format_id ?? info.format_id ?? "b", abort),
      });
    } else {
      if (formats.some((format) => !format.url || (!isHttp(format) && !isHls(format)))) {
        throw new UserFacingError("This video can't be downloaded with this tool yet.");
      }
      sourceFor = (format) => openHttpSource(format, abort.signal);
    }

    // One plain file: relay it byte for byte.
    if (!wantsMp3 && formats.length === 1 && (viaYtDlp || isHttp(formats[0]))) {
      const { stream, size } = await sourceFor(formats[0]);
      const extension = formats[0].ext || info.ext || "mp4";
      stream.once("close", () => abort.abort());
      return {
        stream,
        size,
        filename: safeFilename(info.title, extension === "unknown_video" ? "mp4" : extension),
        contentType: contentTypes[extension] ?? "application/octet-stream",
      };
    }

    // Otherwise join/convert the parts with ffmpeg while streaming.
    const inputs: FfmpegInput[] = [];
    for (const format of formats) {
      inputs.push(
        viaYtDlp || isHttp(format)
          ? { format, source: (await sourceFor(format)).stream }
          : { format, url: await checkedUrl(format) },
      );
    }

    let outputArgs: string[];
    let extension: string;
    if (wantsMp3) {
      outputArgs = ["-vn", "-c:a", "libmp3lame", "-q:a", "2", "-f", "mp3"];
      extension = "mp3";
    } else {
      const mp4Friendly = formats.every((format) => ["mp4", "m4a", "m4v"].includes(format.ext ?? "")) ||
        (formats.length === 1 && isHls(formats[0]));
      // yt-dlp lists the picture part first and the sound part second.
      const maps = inputs.length > 1 ? ["-map", "0:v:0", "-map", "1:a:0"] : ["-map", "0"];
      outputArgs = [
        ...maps,
        "-c",
        "copy",
        ...(mp4Friendly
          ? ["-movflags", "frag_keyframe+empty_moov+default_base_moof", "-f", "mp4"]
          : ["-f", "matroska"]),
      ];
      extension = mp4Friendly ? "mp4" : "mkv";
    }

    const stream = runFfmpeg(inputs, outputArgs, abort);
    stream.once("close", () => abort.abort());
    return {
      stream,
      filename: safeFilename(info.title, extension),
      contentType: contentTypes[extension] ?? "application/octet-stream",
    };
  } catch (error) {
    abort.abort();
    throw error;
  }
}
