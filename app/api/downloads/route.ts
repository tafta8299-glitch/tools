import { Readable, Transform } from "node:stream";
import { isProgressToken, updateProgress } from "@/lib/download-progress";
import { openMediaDownload } from "@/lib/media-stream";
import {
  describeMediaError,
  isDownloadQuality,
  isModeAllowed,
  isSocialDownloadMode,
  isSocialPlatformId,
  validateMediaUrl,
} from "@/lib/social-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxActiveStreams = Math.max(1, Number(process.env.MAX_CONCURRENT_DOWNLOADS) || 6);
const counterKey = "__trovflexActiveMediaStreams";
const counter = globalThis as typeof globalThis & { [counterKey]?: number };

/**
 * GET /api/downloads?platform=&mode=&url=[&index=][&quality=][&token=]
 * Streams the media straight to the browser as an attachment. Nothing is stored.
 * With `token`, progress can be read from /api/downloads/status.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawToken = params.get("token");
  const token = isProgressToken(rawToken) ? rawToken : undefined;

  const fail = (message: string, status: number) => {
    if (token) updateProgress(token, { status: "failed", error: message });
    return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  };

  const platform = params.get("platform");
  const mode = params.get("mode");
  const rawIndex = params.get("index");
  const index = rawIndex === null ? undefined : Number(rawIndex);

  if (!isSocialPlatformId(platform) || !isSocialDownloadMode(mode) || !isModeAllowed(platform, mode)) {
    return fail("Choose a mode supported by the selected platform.", 400);
  }
  if (index !== undefined && (!Number.isInteger(index) || index < 1 || index > 500)) {
    return fail("Invalid item number.", 400);
  }
  const rawQuality = params.get("quality");
  if (rawQuality !== null && !isDownloadQuality(rawQuality)) {
    return fail("Invalid quality option.", 400);
  }
  const quality = rawQuality ?? undefined;
  const url = await validateMediaUrl(params.get("url"), platform);
  if (!url) return fail("This link isn't from this site. Check the link and try again.", 400);

  if ((counter[counterKey] ?? 0) >= maxActiveStreams) {
    return fail("The downloader is busy. Please try again in a minute.", 503);
  }
  counter[counterKey] = (counter[counterKey] ?? 0) + 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    counter[counterKey] = Math.max(0, (counter[counterKey] ?? 1) - 1);
  };

  if (token) updateProgress(token, { status: "preparing", received: 0 });

  try {
    const download = await openMediaDownload({
      platform,
      mode,
      url,
      index,
      quality,
      signal: request.signal,
    });

    // Count bytes on their way to the browser, for the page's progress display.
    let received = 0;
    let finished = false;
    const counted = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.length;
        if (token) updateProgress(token, { received });
        callback(null, chunk);
      },
    });
    if (token) updateProgress(token, { status: "sending", received: 0, total: download.size });
    counted.once("end", () => {
      finished = true;
      if (token) updateProgress(token, { status: "done", received });
    });
    counted.once("close", () => {
      release();
      if (!finished && token) {
        updateProgress(token, { status: "failed", error: "The download was interrupted." });
      }
    });
    download.stream.once("error", (error) => {
      console.error("Media stream failed.", error);
      counted.destroy(error);
    });
    download.stream.pipe(counted);

    const asciiName = download.filename.replace(/[^a-zA-Z0-9._-]/gu, "_");
    return new Response(Readable.toWeb(counted) as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": download.contentType,
        ...(download.size ? { "Content-Length": String(download.size) } : {}),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(download.filename)}`,
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    release();
    if (request.signal.aborted) {
      if (token) updateProgress(token, { status: "failed", error: "The download was cancelled." });
      return new Response(null, { status: 499 });
    }
    console.error("Media download failed.", error);
    return fail(describeMediaError(error, platform, mode), 502);
  }
}
