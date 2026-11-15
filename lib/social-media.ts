import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { resolveYtDlp, runYtDlp } from "@/lib/yt-dlp";
import {
  socialPlatforms,
  type SocialDownloadMode,
  type SocialPlatformId,
} from "@/data/social-platforms";

/*
 * Link lookup, validation and shared helpers for the social media downloaders.
 * Nothing here downloads or stores media; see lib/media-stream.ts for delivery.
 */

export type MediaItem = {
  /** Public page URL that the download request sends back. */
  url: string;
  /** 1-based item number inside a multi-item post (carousel, thread). */
  index?: number;
  title: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  /** Direct playable/viewable media URL for the preview, when the platform offers one. */
  previewUrl?: string;
  /** Embeddable player URL (YouTube). */
  embedUrl?: string;
  isImage?: boolean;
  /** Download choices: video resolutions, then audio-only formats. */
  options: DownloadOption[];
};

/** `best`, `h<height>` (video at that height), `mp3`, or `m4a` (original audio). */
export type DownloadQuality = "best" | "mp3" | "m4a" | `h${number}`;

export type DownloadOption = {
  value: DownloadQuality;
  /** Short name, e.g. "1080p" or "MP3". */
  label: string;
  /** Plain-language hint, e.g. "Full HD" or "Plays everywhere". */
  detail?: string;
  kind: "video" | "audio" | "image";
  /** Approximate size in bytes, when the platform reports it. */
  size?: number;
  /** False when the video uses a newer format some older devices can't play. */
  playsEverywhere?: boolean;
};

export function isDownloadQuality(value: unknown): value is DownloadQuality {
  return typeof value === "string" && /^(best|mp3|m4a|h\d{2,4})$/u.test(value);
}

export type MediaLookup = {
  items: MediaItem[];
  failed: Array<{ url: string; error: string }>;
  /** More than 10 links were pasted; only the first 10 were read. */
  truncated: boolean;
  /** For channels/profiles: pass this as `offset` to load the next page. */
  nextOffset?: number;
};

export type YtDlpFormat = {
  format_id?: string;
  url?: string;
  ext?: string;
  protocol?: string;
  vcodec?: string;
  acodec?: string;
  height?: number;
  width?: number;
  filesize?: number;
  filesize_approx?: number;
  http_headers?: Record<string, string>;
  cookies?: string;
  downloader_options?: { http_chunk_size?: number };
};

export type YtDlpInfo = YtDlpFormat & {
  _type?: string;
  id?: string;
  title?: string;
  webpage_url?: string;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string }>;
  duration?: number;
  uploader?: string;
  channel?: string;
  formats?: YtDlpFormat[];
  requested_formats?: YtDlpFormat[];
  entries?: Array<YtDlpInfo | null>;
};

const maxCollectionItems = 50;
/** Items per "Load more" page for channels, playlists and profiles. */
export const collectionPageSize = 50;
/** Deepest item a channel/profile can be paged to. */
export const maxCollectionOffset = 10_000;
const maxLinks = 10;
const lookupTimeoutMs = 90 * 1000;
export const browserUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

export async function readInfo(url: string, extraArgs: string[]) {
  const binary = await resolveYtDlp();
  const { stdout } = await runYtDlp(
    binary,
    ["--dump-single-json", "--no-warnings", "--no-color", ...extraArgs, "--", url],
    { captureStdout: true, timeoutMs: lookupTimeoutMs },
  );
  return JSON.parse(stdout) as YtDlpInfo;
}

function pickThumbnail(info: YtDlpInfo) {
  if (info.thumbnail) return info.thumbnail;
  const thumbnails = info.thumbnails?.filter((thumbnail) => thumbnail.url);
  return thumbnails?.at(-1)?.url;
}

function youtubeEmbedUrl(info: YtDlpInfo, platform: SocialPlatformId) {
  if (platform !== "youtube" || !info.id || !/^[\w-]{11}$/u.test(info.id)) return undefined;
  return `https://www.youtube-nocookie.com/embed/${info.id}`;
}

function pickPreview(info: YtDlpInfo): { previewUrl?: string; isImage?: boolean } {
  const isHttp = (protocol?: string) => !protocol || protocol === "https" || protocol === "http";
  const formats = info.formats?.length ? info.formats : info.url ? [info] : [];

  const images = formats.filter((format) => format.url && imageExtensions.has(format.ext ?? ""));
  if (images.length && images.length === formats.length) {
    return { previewUrl: images.at(-1)?.url, isImage: true };
  }

  const playable = formats
    .filter(
      (format) =>
        format.url &&
        isHttp(format.protocol) &&
        (format.ext === "mp4" || format.ext === "webm") &&
        format.vcodec !== "none" &&
        format.acodec !== "none",
    )
    .sort((left, right) => (left.height ?? 0) - (right.height ?? 0));
  return { previewUrl: playable.at(-1)?.url };
}

function formatSize(format?: YtDlpFormat) {
  return format?.filesize ?? format?.filesize_approx ?? undefined;
}

function resolutionLabel(height: number, width?: number) {
  // Vertical videos (TikTok, Shorts) are named by their short side, like players do.
  const shortSide = width ? Math.min(width, height) : height;
  const detail =
    shortSide >= 2160
      ? "4K Ultra HD"
      : shortSide >= 1440
        ? "2K"
        : shortSide >= 1080
          ? "Full HD"
          : shortSide >= 720
            ? "HD"
            : shortSide >= 480
              ? "Standard"
              : "Small file";
  return { label: `${shortSide}p`, detail };
}

/** Lists the qualities this item can be downloaded in, best first. */
function buildOptions(info: YtDlpInfo): { options: DownloadOption[]; isImage: boolean } {
  const usable = (info.formats?.length ? info.formats : info.url ? [info] : []).filter(
    (format) =>
      format.url &&
      (!format.protocol || ["https", "http", "m3u8", "m3u8_native"].includes(format.protocol)),
  );

  if (usable.length && usable.every((format) => imageExtensions.has(format.ext ?? ""))) {
    return {
      options: [{ value: "best", label: "Original", detail: "Full-size image", kind: "image" }],
      isImage: true,
    };
  }

  const audioOnly = usable.filter(
    (format) => format.vcodec === "none" && format.acodec && format.acodec !== "none",
  );
  const bestM4a = audioOnly
    .filter((format) => format.ext === "m4a")
    .sort((left, right) => (formatSize(right) ?? 0) - (formatSize(left) ?? 0))[0];
  const hasAudio =
    audioOnly.length > 0 || usable.some((format) => format.acodec && format.acodec !== "none");

  const video = usable.filter((format) => format.vcodec !== "none" && format.height);
  const heights = [...new Set(video.map((format) => format.height as number))].sort((a, b) => b - a);

  const options: DownloadOption[] = [];
  const seenLabels = new Set<string>();
  for (const height of heights) {
    const atHeight = video.filter((format) => format.height === height);
    // Mirror the server's preference: H.264 MP4, then any MP4, then anything.
    const isH264 = (format: YtDlpFormat) => /^(avc|h264)/iu.test(format.vcodec ?? "");
    const group =
      [
        atHeight.filter((format) => format.ext === "mp4" && isH264(format)),
        atHeight.filter((format) => format.ext === "mp4"),
        atHeight,
      ].find((candidates) => candidates.length) ?? atHeight;
    const chosen = group.sort((left, right) => (formatSize(right) ?? 0) - (formatSize(left) ?? 0))[0];
    const { label, detail } = resolutionLabel(height, chosen.width);
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);

    const videoSize = formatSize(chosen);
    const needsAudio = chosen.acodec === "none";
    const audioSize = needsAudio ? formatSize(bestM4a ?? audioOnly[0]) : 0;
    // An unknown codec is assumed to be fine; only flag ones known to be newer.
    const playsEverywhere = !/^(hev|hvc|h265|bytevc|av01|vp0?9)/iu.test(chosen.vcodec ?? "");
    options.push({
      value: `h${height}`,
      label,
      detail: playsEverywhere ? detail : `${detail}, may not play on older devices`,
      playsEverywhere,
      kind: "video",
      size: videoSize !== undefined && audioSize !== undefined ? videoSize + audioSize : undefined,
    });
  }

  if (!options.length) {
    options.push({ value: "best", label: "Best", detail: "Highest available", kind: "video" });
  }
  if (hasAudio || !usable.length) {
    options.push({ value: "mp3", label: "MP3", detail: "Plays everywhere", kind: "audio" });
  }
  if (bestM4a) {
    options.push({
      value: "m4a",
      label: "M4A",
      detail: "Original quality",
      kind: "audio",
      size: formatSize(bestM4a),
    });
  }
  return { options, isImage: false };
}

function toItem(
  info: YtDlpInfo,
  platform: SocialPlatformId,
  pageUrl: string,
  index?: number,
): MediaItem {
  const { options, isImage } = buildOptions(info);
  return {
    options,
    ...(isImage ? { isImage } : {}),
    url: pageUrl,
    index,
    title: info.title?.trim() || "Untitled media",
    thumbnail: pickThumbnail(info),
    duration: typeof info.duration === "number" ? info.duration : undefined,
    uploader: info.uploader ?? info.channel,
    embedUrl: youtubeEmbedUrl(info, platform),
    ...(platform === "youtube" ? {} : pickPreview(info)),
  };
}

function collectionUrl(platform: SocialPlatformId, url: string) {
  if (platform !== "youtube") return url;
  const parsed = new URL(url);
  // A channel home page lists tabs; point it at the Videos tab instead.
  if (/^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/?$/u.test(parsed.pathname)) {
    parsed.pathname = `${parsed.pathname.replace(/\/$/u, "")}/videos`;
  }
  return parsed.toString();
}

/**
 * Lists one page of a channel, playlist, profile or board (newest first).
 * `offset` skips items already shown, so users can keep loading older ones.
 */
async function lookupCollection(
  platform: SocialPlatformId,
  url: string,
  offset: number,
): Promise<MediaLookup> {
  const sources =
    platform === "pinterest" ? await getPinterestProfileBoards(url) : [collectionUrl(platform, url)];
  if (!sources.length) {
    throw new UserFacingError(
      "We couldn't find any public boards on this profile. Try a public profile or board link.",
    );
  }

  // Read just enough entries to fill this page and to know whether another exists.
  const needed = offset + collectionPageSize + 1;
  const entries: Array<{ entry: YtDlpInfo; pageUrl: string }> = [];
  for (const source of sources) {
    if (entries.length >= needed) break;
    const info = await readInfo(source, [
      "--flat-playlist",
      "--yes-playlist",
      "--playlist-end",
      String(needed - entries.length),
    ]);
    for (const entry of info.entries ?? []) {
      if (!entry) continue;
      const candidate =
        entry.webpage_url ?? (entry.url && /^https?:/iu.test(entry.url) ? entry.url : undefined);
      const pageUrl = candidate ? validatePlatformUrl(candidate, platform) : undefined;
      if (pageUrl) entries.push({ entry, pageUrl });
    }
  }

  const page = entries.slice(offset, offset + collectionPageSize);
  return {
    items: page.map(({ entry, pageUrl }) => toItem(entry, platform, pageUrl)),
    failed: [],
    truncated: false,
    nextOffset: entries.length > offset + collectionPageSize ? offset + page.length : undefined,
  };
}

async function lookupLink(platform: SocialPlatformId, url: string): Promise<MediaItem[]> {
  const profileProblem = profileLinkProblem(platform, url);
  if (profileProblem) throw new UserFacingError(profileProblem);

  if (platform === "website") {
    const resolved = await resolveWebsiteMediaUrl(url);
    if (resolved.title) {
      return [
        {
          url,
          title: resolved.title.replace(/_/gu, " "),
          options: [
            { value: "best", label: "Best", detail: "Highest available", kind: "video" },
            { value: "mp3", label: "MP3", detail: "Plays everywhere", kind: "audio" },
          ],
        },
      ];
    }
  }

  const info = await readInfo(await resolveMediaUrl(url), ["--no-playlist"]);
  if (info._type === "playlist" && info.entries?.length) {
    return info.entries
      .filter((entry): entry is YtDlpInfo => Boolean(entry))
      .slice(0, maxCollectionItems)
      .map((entry, position) =>
        toItem(
          { ...entry, title: entry.title || `${info.title ?? "Item"} (${position + 1})` },
          platform,
          url,
          position + 1,
        ),
      );
  }
  return [toItem(info, platform, url)];
}

export async function lookupMedia({
  platform,
  mode,
  urls,
  offset = 0,
}: {
  platform: SocialPlatformId;
  mode: SocialDownloadMode;
  urls: string[];
  offset?: number;
}): Promise<MediaLookup> {
  if (mode === "profile" || mode === "channel") {
    return lookupCollection(platform, urls[0], offset);
  }

  const result: MediaLookup = { items: [], failed: [], truncated: urls.length > maxLinks };
  for (const url of urls.slice(0, maxLinks)) {
    try {
      result.items.push(...(await lookupLink(platform, url)));
    } catch (error) {
      console.error(`Media lookup failed for ${socialPlatforms[platform].name}.`, error);
      result.failed.push({ url, error: describeMediaError(error, platform, mode) });
    }
  }
  return result;
}

export function describeMediaError(
  error: unknown,
  platform: SocialPlatformId,
  mode: SocialDownloadMode,
) {
  // Messages we wrote for people are shown as they are.
  if (error instanceof UserFacingError) return error.message;

  const message = error instanceof Error ? error.message : "";
  const detail =
    error && typeof error === "object" && "stderr" in error && typeof error.stderr === "string"
      ? `${error.stderr}\n${message}`
      : message;
  const site = socialPlatforms[platform].name;

  if (/Website page has no supported public media stream/iu.test(detail)) {
    return "We couldn't find a video on this page that can be downloaded.";
  }
  if (platform === "pinterest" && mode === "profile" && /Unsupported URL/iu.test(detail)) {
    return "We couldn't open this Pinterest board. Paste a public board link, or use Multiple links with a pin link.";
  }
  if (/timed out/iu.test(detail)) {
    return `${site} took too long to respond. Please try again.`;
  }
  if (/private video|video is private|this account is private|private (post|account)/iu.test(detail)) {
    return "This is private, so it can't be downloaded.";
  }
  if (/confirm your age|age[- ]restricted|inappropriate for some users/iu.test(detail)) {
    return "This video is age-restricted and needs a login, so it can't be downloaded.";
  }
  if (/not a bot|too many requests|HTTP Error 429|rate[- ]limit/iu.test(detail)) {
    return `${site} is busy right now. Please try again in a few minutes.`;
  }
  if (/live event|is live|premieres in|will begin in/iu.test(detail)) {
    return "Live streams and premieres can be downloaded after they have ended.";
  }
  if (
    /log ?in|sign ?in|login required|authentication|cookies|members[- ]only|join this channel/iu.test(
      detail,
    )
  ) {
    return `${site} only shows this to logged-in users, so it can't be downloaded.`;
  }
  if (/requested format is not available|format is not available/iu.test(detail)) {
    return "That quality isn't available for this video. Please pick a different one.";
  }
  if (/unavailable|has been removed|not available|HTTP Error 404|does not exist|deleted/iu.test(detail)) {
    return "This is no longer available. It may have been deleted, or blocked in your region.";
  }
  if (/no video|no media|there is no video|no formats found/iu.test(detail)) {
    return "We couldn't find a video or photo at this link.";
  }
  if (/Unsupported URL/iu.test(detail)) {
    return `This link isn't supported. Check that it is a link to a public ${site} post or video.`;
  }
  return "This couldn't be downloaded. The post may be private, deleted, or not supported. Please try another link.";
}

/** An error whose message is already written for the people using the site. */
export class UserFacingError extends Error {}

export async function resolveWebsiteMediaUrl(
  inputUrl: string,
): Promise<{ url: string; title?: string }> {
  const input = new URL(inputUrl);
  if (!["quranacademy.edu.pk", "quranchannel.akqs.org"].includes(input.hostname.toLowerCase())) {
    return { url: inputUrl };
  }

  const headers = { "User-Agent": browserUserAgent };
  let embedUrl = inputUrl;

  if (input.hostname.toLowerCase() === "quranacademy.edu.pk") {
    const pageResponse = await fetch(inputUrl, {
      headers,
      redirect: "error",
    });
    if (!pageResponse.ok) {
      throw new Error("Could not read the public Quran Academy page.");
    }

    const pageHtml = await pageResponse.text();
    const iframeSource = pageHtml.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/iu)?.[1];
    if (!iframeSource) {
      throw new Error("Website page has no supported public media stream.");
    }

    const iframeUrl = await validateWebsiteUrl(new URL(iframeSource, inputUrl).toString());
    if (!iframeUrl || new URL(iframeUrl).hostname.toLowerCase() !== "quranchannel.akqs.org") {
      throw new Error("Website page has no supported public media stream.");
    }
    embedUrl = iframeUrl;
  }

  const embedResponse = await fetch(embedUrl, {
    headers,
    redirect: "error",
  });
  if (!embedResponse.ok) {
    throw new Error("Could not read the public Quran Channel player.");
  }

  const embedHtml = (await embedResponse.text())
    .replace(/\\u0026/giu, "&")
    .replace(/\\\//gu, "/");
  const streamSource = embedHtml.match(
    /https?:\/\/[^"'\\\s<>]+\.m3u8(?:\?[^"'\\\s<>]*)?/iu,
  )?.[0];
  if (!streamSource) {
    throw new Error("Website page has no supported public media stream.");
  }

  const streamUrl = await validateWebsiteUrl(streamSource);
  if (!streamUrl || new URL(streamUrl).hostname.toLowerCase() !== "data.quranacademy.com") {
    throw new Error("Website page has no supported public media stream.");
  }

  const title = embedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1] ?? "";
  const safeTitle =
    title
      .replace(/<[^>]*>/gu, "")
      .replace(/&amp;/giu, "&")
      .normalize("NFKD")
      .replace(/[^\w.-]+/gu, "_")
      .replace(/^_+|_+$/gu, "")
      .slice(0, 120) || "website-media";

  return { url: streamUrl, title: safeTitle };
}

export async function resolveMediaUrl(inputUrl: string) {
  try {
    const url = new URL(inputUrl);
    const hostname = url.hostname.toLowerCase();
    if (!["pin.it", "youtu.be", "fb.watch"].includes(hostname)) {
      return inputUrl;
    }

    const response = await fetch(url.toString(), {
      redirect: "follow",
      headers: { "User-Agent": browserUserAgent },
    });

    return response.url || url.toString();
  } catch {
    return inputUrl;
  }
}

async function getPinterestProfileBoards(inputUrl: string) {
  try {
    const url = new URL(await resolveMediaUrl(inputUrl));
    if (!["pinterest.com", "www.pinterest.com"].includes(url.hostname.toLowerCase())) {
      return [];
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (!segments.length || segments[0].toLowerCase() === "pin") return [];
    if (segments.length >= 2) return [url.toString()];

    const response = await fetch(url, { headers: { "User-Agent": browserUserAgent } });
    if (!response.ok) return [];

    const username = segments[0].toLowerCase();
    const html = await response.text();
    const boards = new Set<string>();
    for (const match of html.matchAll(/"url":"(\/([^/"?#]+)\/([^/"?#]+)\/)"/gu)) {
      if (match[2].toLowerCase() !== username) continue;
      boards.add(new URL(match[1], url).toString());
    }
    return [...boards];
  } catch {
    return [];
  }
}

export function isSocialPlatformId(value: unknown): value is SocialPlatformId {
  return typeof value === "string" && Object.hasOwn(socialPlatforms, value);
}

export function isSocialDownloadMode(value: unknown): value is SocialDownloadMode {
  return (
    value === "links" ||
    value === "profile" ||
    value === "audio" ||
    value === "video" ||
    value === "channel"
  );
}

export function isModeAllowed(platform: SocialPlatformId, mode: SocialDownloadMode) {
  if (platform === "website") return mode === "links";
  if (mode === "profile" && !socialPlatforms[platform].supportsProfile) return false;
  const isYouTubeMode = mode === "audio" || mode === "video" || mode === "channel";
  return (platform === "youtube") === isYouTubeMode;
}

/**
 * When a whole-profile link is pasted for a site whose profiles can't be listed,
 * returns a plain explanation of what to paste instead.
 */
export function profileLinkProblem(platform: SocialPlatformId, value: string) {
  if (socialPlatforms[platform].supportsProfile || platform === "website") return undefined;
  let segments: string[];
  try {
    segments = new URL(value).pathname.split("/").filter(Boolean).map((part) => part.toLowerCase());
  } catch {
    return undefined;
  }
  const looksLikeProfile =
    platform === "instagram"
      ? segments.length > 0 &&
        !["p", "reel", "reels", "tv", "stories"].includes(segments[0]) &&
        !["p", "reel", "tv"].includes(segments[1] ?? "")
      : platform === "x"
        ? segments.length === 1 || (segments.length === 2 && segments[1] !== "status")
        : platform === "reddit"
          ? ["r", "u", "user"].includes(segments[0] ?? "") && !segments.includes("comments")
          : platform === "facebook"
            ? segments.length === 1 &&
              !["watch", "reel", "share", "story.php", "video.php", "photo.php"].includes(segments[0])
            : false;
  if (!looksLikeProfile) return undefined;
  const { name, postNoun } = socialPlatforms[platform];
  return `This is a profile link. ${name} doesn't let us list a whole profile without logging in, so open the ${postNoun} you want, copy its link, and paste that here.`;
}

export function validateMediaUrl(value: unknown, platform: SocialPlatformId) {
  return platform === "website"
    ? validateWebsiteUrl(value)
    : Promise.resolve(validatePlatformUrl(value, platform));
}

function isPublicAddress(address: string) {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    const [first, second] = octets;
    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 2 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19 || second === 51)) ||
      (first === 203 && second === 0) ||
      first >= 224
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      return isPublicAddress(normalized.slice(7));
    }
    return (
      (normalized.startsWith("2") || normalized.startsWith("3")) &&
      !normalized.startsWith("2001:db8:")
    );
  }

  return false;
}

export function validatePlatformUrl(
  value: unknown,
  platform: SocialPlatformId,
): string | undefined {
  if (typeof value !== "string" || value.length > 4096) return undefined;

  try {
    const url = new URL(value.trim());
    const allowedHosts = socialPlatforms[platform].hostnames as readonly string[];
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port ||
      !allowedHosts.includes(url.hostname.toLowerCase())
    ) {
      return undefined;
    }

    url.protocol = "https:";
    url.port = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

/** Accepts only public HTTP(S) URLs whose host resolves to public IP addresses. */
export async function validateWebsiteUrl(value: unknown): Promise<string | undefined> {
  if (typeof value !== "string" || value.length > 8192) return undefined;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase().replace(/\.$/u, "");
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && url.port !== "80" && url.port !== "443") ||
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return undefined;
    }

    const bareHost = hostname.replace(/^\[|\]$/gu, "");
    const addresses = isIP(bareHost)
      ? [{ address: bareHost }]
      : await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      return undefined;
    }

    url.hostname = hostname;
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}
