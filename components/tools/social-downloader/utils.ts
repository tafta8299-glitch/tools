import type { SocialDownloadMode, SocialPlatformId } from "@/data/social-platforms";
import type { DownloadQuality, MediaItem } from "@/lib/social-media";

export function itemKey(item: MediaItem) {
  return `${item.url}#${item.index ?? 0}`;
}

export function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return undefined;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}` : `${minutes}:${secs}`;
}

/** "7 h 12 min" style total for a set of videos. */
export function formatTotalDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function formatBytes(bytes?: number) {
  if (!bytes) return undefined;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function downloadHref(
  platform: SocialPlatformId,
  mode: SocialDownloadMode,
  item: MediaItem,
  quality: DownloadQuality,
) {
  const params = new URLSearchParams({ platform, mode, url: item.url, quality });
  if (item.index) params.set("index", String(item.index));
  return `/api/downloads?${params.toString()}`;
}
