/*
 * Saves several downloads one after another, never in parallel, so a user only
 * ever uses one stream on the server. By default each file is a normal browser
 * download (it shows in the browser's downloads list); in Chrome/Edge the user
 * can instead pick a folder and the page writes each file into it.
 */

export type BatchItemState =
  | { status: "waiting" }
  | { status: "downloading"; received: number; total?: number; preparing?: boolean }
  | { status: "done" }
  | { status: "failed"; error: string }
  | { status: "cancelled" };

type DirectoryPicker = (options?: {
  mode?: "read" | "readwrite";
  id?: string;
}) => Promise<FileSystemDirectoryHandle>;

type WritableDirectory = FileSystemDirectoryHandle & {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<
    FileSystemFileHandle & {
      createWritable(): Promise<{
        write(data: Uint8Array): Promise<void>;
        close(): Promise<void>;
        abort(): Promise<void>;
      }>;
    }
  >;
};

export function supportsFolderSave() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Asks the user for a folder. Must be called straight from a click. */
export function pickFolder() {
  const picker = (window as unknown as { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker;
  if (!picker) return Promise.resolve(undefined);
  return picker({ mode: "readwrite", id: "trovflex-downloads" });
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function filenameFrom(response: Response) {
  const header = response.headers.get("content-disposition") ?? "";
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/iu)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // fall through to the plain name
    }
  }
  return header.match(/filename="([^"]+)"/iu)?.[1] ?? "download";
}

function cleanFilename(name: string) {
  return name.replace(/[\\/:*?"<>|\u0000-\u001f]+/gu, "_").slice(0, 180);
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Stopped", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Stopped", "AbortError"));
      },
      { once: true },
    );
  });
}

type ServerProgress = {
  status: "preparing" | "sending" | "done" | "failed" | "unknown";
  received?: number;
  total?: number;
  error?: string;
};

/**
 * Starts a normal browser download (it appears in the browser's downloads
 * list and saves to the Downloads folder), then waits until the server has
 * sent the whole file, so the next download only starts after this one.
 */
export async function browserDownload(
  url: string,
  {
    signal,
    onProgress,
  }: {
    signal: AbortSignal;
    onProgress: (received: number, total: number | undefined, preparing: boolean) => void;
  },
) {
  const token = crypto.randomUUID().replace(/-/gu, "");
  const link = document.createElement("a");
  link.href = `${url}&token=${token}`;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  link.remove();

  const startedAt = Date.now();
  while (true) {
    await wait(1000, signal);
    let progress: ServerProgress;
    try {
      const response = await fetch(`/api/downloads/status?token=${token}`, {
        cache: "no-store",
        signal,
      });
      progress = (await response.json()) as ServerProgress;
    } catch (error) {
      if (isAbortError(error)) throw error;
      continue; // brief network hiccup: keep waiting
    }

    if (progress.status === "unknown") {
      if (Date.now() - startedAt > 30_000) {
        throw new Error(
          "Your browser didn't start this download. Allow this site to download multiple files, then use Retry failed.",
        );
      }
      continue;
    }
    if (progress.status === "done") return;
    if (progress.status === "failed") throw new Error(progress.error ?? "Download failed.");
    onProgress(progress.received ?? 0, progress.total, progress.status === "preparing");
  }
}

/** Writes one file into a folder the user picked (Chrome/Edge). */
export async function saveDownload(
  url: string,
  {
    signal,
    directory,
    prefix = "",
    onProgress,
  }: {
    signal: AbortSignal;
    directory: FileSystemDirectoryHandle;
    prefix?: string;
    onProgress: (received: number, total?: number) => void;
  },
) {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) {
    let message = "Download failed. Please try again.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }

  const total = Number(response.headers.get("content-length")) || undefined;
  const name = cleanFilename(`${prefix}${filenameFrom(response)}`);
  const reader = response.body.getReader();
  let received = 0;

  const folder = directory as WritableDirectory;
  const file = await folder.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      received += value.length;
      onProgress(received, total);
    }
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    await directory.removeEntry(name).catch(() => {});
    throw error;
  }
}
