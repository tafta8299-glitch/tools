/*
 * Tiny in-memory record of how far each browser download has got, keyed by a
 * random token the page adds to the download link. It lets the page wait for
 * one native browser download to finish before starting the next, without the
 * server storing any media. Entries expire after 30 minutes.
 */

export type DownloadProgress = {
  status: "preparing" | "sending" | "done" | "failed";
  received: number;
  total?: number;
  error?: string;
  updatedAt: number;
};

const lifetimeMs = 30 * 60 * 1000;
const maxEntries = 5000;
const storeKey = "__trovflexDownloadProgress";
const globalStore = globalThis as typeof globalThis & {
  [storeKey]?: Map<string, DownloadProgress>;
};
const store = (globalStore[storeKey] ??= new Map<string, DownloadProgress>());

export function isProgressToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/u.test(value);
}

function prune() {
  const cutoff = Date.now() - lifetimeMs;
  for (const [token, entry] of store) {
    if (entry.updatedAt < cutoff || store.size > maxEntries) store.delete(token);
  }
}

export function updateProgress(token: string, patch: Partial<Omit<DownloadProgress, "updatedAt">>) {
  if (store.size > maxEntries / 2) prune();
  const current = store.get(token) ?? { status: "preparing", received: 0, updatedAt: 0 };
  store.set(token, { ...current, ...patch, updatedAt: Date.now() });
}

export function getProgress(token: string) {
  const entry = store.get(token);
  if (entry && entry.updatedAt < Date.now() - lifetimeMs) {
    store.delete(token);
    return undefined;
  }
  return entry;
}
