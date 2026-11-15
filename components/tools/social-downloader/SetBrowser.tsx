"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderDown,
  LoaderCircle,
  RotateCcw,
  Square,
} from "lucide-react";
import type { SocialDownloadMode, SocialPlatformId } from "@/data/social-platforms";
import type { DownloadOption, DownloadQuality, MediaItem, MediaLookup } from "@/lib/social-media";
import {
  browserDownload,
  isAbortError,
  pickFolder,
  saveDownload,
  supportsFolderSave,
  type BatchItemState,
} from "./batch-download";
import { QualityChoices, SetItemCard } from "./MediaCard";
import { downloadHref, formatTotalDuration, itemKey } from "./utils";

const setSize = 50;

function setQualityOptions(platform: SocialPlatformId): DownloadOption[] {
  if (platform === "youtube") {
    return [
      { value: "h1080", label: "1080p", detail: "Full HD", kind: "video" },
      { value: "h720", label: "720p", detail: "HD", kind: "video" },
      { value: "h480", label: "480p", detail: "Standard", kind: "video" },
      { value: "h360", label: "360p", detail: "Small file", kind: "video" },
      { value: "mp3", label: "MP3", detail: "Audio only", kind: "audio" },
      { value: "m4a", label: "M4A", detail: "Audio, original", kind: "audio" },
    ];
  }
  if (platform === "pinterest") {
    return [{ value: "best", label: "Original", detail: "Images and videos", kind: "video" }];
  }
  return [
    { value: "best", label: "Best", detail: "Highest available", kind: "video" },
    { value: "mp3", label: "MP3", detail: "Audio only", kind: "audio" },
  ];
}

type Summary = { saved: number; failed: number; cancelled: number };

/**
 * Shows a channel/profile as numbered sets of 50 and downloads the chosen
 * items of one set, one at a time, in a single quality.
 */
export function SetBrowser({
  platform,
  mode,
  firstPage,
  itemNoun,
  loadSet,
}: {
  platform: SocialPlatformId;
  mode: SocialDownloadMode;
  firstPage: MediaLookup;
  itemNoun: string;
  loadSet: (offset: number) => Promise<MediaLookup>;
}) {
  const qualityOptions = setQualityOptions(platform);
  const [pages, setPages] = useState<Record<number, MediaLookup>>({ 0: firstPage });
  const [setIndex, setSetIndex] = useState(0);
  const [lastSet, setLastSet] = useState<number | undefined>(firstPage.nextOffset ? undefined : 0);
  const [loadingSet, setLoadingSet] = useState<number>();
  const [setError, setSetError] = useState("");
  const [goToValue, setGoToValue] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(firstPage.items.map(itemKey)),
  );
  const [quality, setQuality] = useState<DownloadQuality>(
    qualityOptions.find((option) => option.value === "h720")?.value ?? qualityOptions[0].value,
  );
  const [states, setStates] = useState<Record<string, BatchItemState>>({});
  const [running, setRunning] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("");
  const [summary, setSummary] = useState<Summary>();
  const [canPickFolder] = useState(() => supportsFolderSave());
  const [saveTarget, setSaveTarget] = useState<"folder" | "downloads">("downloads");
  const [folderRefused, setFolderRefused] = useState(false);
  const pendingQueueRef = useRef<MediaItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const page = pages[setIndex];
  const items = page?.items ?? [];
  const firstPosition = setIndex * setSize + 1;
  const hasNext = lastSet === undefined || setIndex < lastSet;
  const chosen = items.filter((item) => selected.has(itemKey(item)));
  const totalSeconds = chosen.reduce((sum, item) => sum + (item.duration ?? 0), 0);
  const qualityLabel = qualityOptions.find((option) => option.value === quality)?.label ?? "";
  const busy = running || loadingSet !== undefined;
  const finishedCount = Object.values(states).filter(
    (state) => state.status === "done" || state.status === "failed",
  ).length;
  const queuedCount = Object.keys(states).length;

  useEffect(() => {
    if (!running) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function showSet(target: number) {
    if (target < 0 || busy) return;
    setSetError("");
    setSummary(undefined);
    setStates({});
    const cached = pages[target];
    if (cached) {
      setSetIndex(target);
      setSelected(new Set(cached.items.map(itemKey)));
      return;
    }

    setLoadingSet(target);
    try {
      const result = await loadSet(target * setSize);
      if (!result.items.length) {
        const known = lastSet ?? Math.max(0, target - 1);
        setLastSet(known);
        setSetError(`There is no set ${target + 1}. The last set is ${known + 1}.`);
        return;
      }
      setPages((previous) => ({ ...previous, [target]: result }));
      if (!result.nextOffset) setLastSet(target);
      setSetIndex(target);
      setSelected(new Set(result.items.map(itemKey)));
    } catch (error) {
      setSetError(error instanceof Error ? error.message : "Could not load that set.");
    } finally {
      setLoadingSet(undefined);
    }
  }

  function submitGoTo(event: FormEvent) {
    event.preventDefault();
    const target = Number(goToValue);
    if (!Number.isInteger(target) || target < 1) {
      setSetError("Enter a set number, starting from 1.");
      return;
    }
    void showSet(target - 1);
  }

  async function downloadSet(only?: MediaItem[], target: "folder" | "downloads" = saveTarget) {
    const queue = only ?? chosen;
    if (!queue.length || running) return;
    pendingQueueRef.current = queue;
    setFolderRefused(false);

    let directory: FileSystemDirectoryHandle | undefined;
    if (target === "folder" && canPickFolder) {
      try {
        directory = await pickFolder();
      } catch {
        // Picker closed, or "Don't Allow" chosen on Chrome's permission prompt.
        setFolderRefused(true);
        return;
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setSummary(undefined);
    setStates(Object.fromEntries(queue.map((item) => [itemKey(item), { status: "waiting" } as const])));

    const result: Summary = { saved: 0, failed: 0, cancelled: 0 };
    for (const item of queue) {
      const key = itemKey(item);
      if (controller.signal.aborted) {
        result.cancelled += 1;
        setStates((previous) => ({ ...previous, [key]: { status: "cancelled" } }));
        continue;
      }

      setCurrentTitle(item.title);
      setStates((previous) => ({ ...previous, [key]: { status: "downloading", received: 0 } }));
      const position = firstPosition + items.indexOf(item);
      let lastUpdate = 0;
      try {
        const href = downloadHref(platform, mode, item, quality);
        if (directory) {
          await saveDownload(href, {
            signal: controller.signal,
            directory,
            prefix: `${String(position).padStart(4, "0")} - `,
            onProgress: (received, total) => {
              const now = Date.now();
              if (now - lastUpdate < 250) return;
              lastUpdate = now;
              setStates((previous) => ({ ...previous, [key]: { status: "downloading", received, total } }));
            },
          });
        } else {
          await browserDownload(href, {
            signal: controller.signal,
            onProgress: (received, total, preparing) =>
              setStates((previous) => ({
                ...previous,
                [key]: { status: "downloading", received, total, preparing },
              })),
          });
        }
        result.saved += 1;
        setStates((previous) => ({ ...previous, [key]: { status: "done" } }));
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          result.cancelled += 1;
          setStates((previous) => ({ ...previous, [key]: { status: "cancelled" } }));
        } else {
          result.failed += 1;
          setStates((previous) => ({
            ...previous,
            [key]: {
              status: "failed",
              error: error instanceof Error ? error.message : "Download failed.",
            },
          }));
        }
      }
    }

    abortRef.current = null;
    setCurrentTitle("");
    setRunning(false);
    setSummary(result);
  }

  const failedItems = items.filter((item) => states[itemKey(item)]?.status === "failed");

  const navigation = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => showSet(setIndex - 1)}
        disabled={setIndex === 0 || busy}
        className="inline-flex min-h-10 items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Previous set
      </button>
      <button
        type="button"
        onClick={() => showSet(setIndex + 1)}
        disabled={!hasNext || busy}
        className="inline-flex min-h-10 items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next set
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </div>
  );

  return (
    <section className="space-y-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">
            Set {setIndex + 1}
            {lastSet !== undefined ? ` of ${lastSet + 1}` : ""} · {itemNoun}s {firstPosition}–
            {firstPosition + items.length - 1}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Every set holds up to 50 {itemNoun}s, newest first.
          </p>
        </div>
        {navigation}
        <form onSubmit={submitGoTo} className="flex w-full items-center gap-2 sm:w-auto">
          <label htmlFor="set-number" className="text-xs font-semibold text-[var(--muted)]">
            Go to set
          </label>
          <input
            id="set-number"
            type="number"
            inputMode="numeric"
            min={1}
            max={lastSet !== undefined ? lastSet + 1 : undefined}
            value={goToValue}
            onChange={(event) => setGoToValue(event.target.value)}
            disabled={busy}
            placeholder={String(setIndex + 2)}
            className="min-h-10 w-20 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] focus:ring-2 focus:ring-[var(--accent)]/55 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !goToValue}
            className="min-h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go
          </button>
        </form>
      </div>

      {loadingSet !== undefined ? (
        <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Loading set {loadingSet + 1}…
          {loadingSet >= 10 ? ` Older sets take longer to reach (up to a minute).` : ""}
        </p>
      ) : null}
      {setError ? (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {setError}
        </p>
      ) : null}

      <div className="@container space-y-3 rounded-md border border-[var(--line)] bg-[var(--paper)] p-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">Download this set</h3>
          <p className="text-xs leading-5 text-[var(--muted)]">
            Pick a quality, untick any {itemNoun}s you don&apos;t want, then start. Files are
            saved one after another.
          </p>
        </div>

        {qualityOptions.length > 1 ? (
          <QualityChoices
            name="set-quality"
            legend="Quality for every file in this set"
            options={qualityOptions}
            value={quality}
            recommended={qualityOptions.some((option) => option.value === "h720") ? "h720" : undefined}
            columns="wide"
            disabled={running}
            onChange={setQuality}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-[var(--ink)]">
            <span className="font-semibold">
              {chosen.length} of {items.length}
            </span>{" "}
            selected
            {totalSeconds ? (
              <span className="text-[var(--muted)]"> · {formatTotalDuration(totalSeconds)} in total</span>
            ) : null}
          </p>
          <div className="flex gap-3 text-xs font-semibold">
            <button
              type="button"
              disabled={running}
              onClick={() => setSelected(new Set(items.map(itemKey)))}
              className="text-[var(--ink)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              Select all
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => setSelected(new Set())}
              className="text-[var(--ink)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {canPickFolder && !running ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-[var(--muted)]">Save files to</p>
            <div role="group" aria-label="Save files to" className="grid grid-cols-2 gap-1 rounded-md bg-[var(--surface)] p-1">
              {(
                [
                  { value: "downloads", label: "Downloads folder", icon: Download },
                  { value: "folder", label: "A folder I choose", icon: FolderDown },
                ] as const
              ).map((choice) => {
                const Icon = choice.icon;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    aria-pressed={saveTarget === choice.value}
                    onClick={() => {
                      setSaveTarget(choice.value);
                      setFolderRefused(false);
                    }}
                    className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded px-2 text-sm font-semibold transition-colors ${
                      saveTarget === choice.value
                        ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm ring-1 ring-[var(--line)]"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {folderRefused && !running ? (
          <div role="alert" className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              <span className="font-semibold">No folder access, so nothing was downloaded.</span> To
              save into a folder, pick one and choose <span className="font-semibold">Allow</span>{" "}
              when Chrome asks &ldquo;Allow this site to edit files?&rdquo;. Or save to your
              Downloads folder instead, which needs no permission.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSaveTarget("downloads");
                  void downloadSet(pendingQueueRef.current, "downloads");
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"
              >
                <Download aria-hidden="true" className="size-4" />
                Save to Downloads instead
              </button>
              <button
                type="button"
                onClick={() => void downloadSet(pendingQueueRef.current, "folder")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-amber-300 bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] hover:border-[var(--accent-dark)]"
              >
                <FolderDown aria-hidden="true" className="size-4" />
                Try a folder again
              </button>
            </div>
          </div>
        ) : null}

        {running ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--ink)]">
              <span className="font-semibold">
                Saving {Math.min(finishedCount + 1, queuedCount)} of {queuedCount} to your computer
              </span>
              {currentTitle ? <span className="text-[var(--muted)]"> · {currentTitle}</span> : null}
            </p>
            <p className="text-xs leading-5 text-[var(--muted)]">
              {saveTarget === "downloads"
                ? "Each file appears in your browser's downloads list (top-right in Chrome and Edge) and saves to your Downloads folder. The next one starts when it finishes."
                : "Each file is written straight into the folder you picked. The next one starts when it finishes."}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--accent-dark)] transition-[width]"
                style={{ width: `${queuedCount ? (finishedCount / queuedCount) * 100 : 0}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-300 bg-[var(--surface)] px-4 text-sm font-semibold text-red-800 hover:bg-red-50"
            >
              <Square aria-hidden="true" className="size-3.5 fill-current" />
              Stop
            </button>
            <p className="text-xs text-[var(--muted)]">
              Keep this tab open until the set finishes.
              {saveTarget === "downloads"
                ? " Stop prevents the next files; a file already downloading finishes in your browser."
                : ""}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => downloadSet()}
            disabled={!chosen.length || loadingSet !== undefined}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveTarget === "folder" ? (
              <FolderDown aria-hidden="true" className="size-4" />
            ) : (
              <Download aria-hidden="true" className="size-4" />
            )}
            Download {chosen.length} {itemNoun}
            {chosen.length === 1 ? "" : "s"} · {qualityLabel}
          </button>
        )}

        {!running && !folderRefused ? (
          saveTarget === "folder" ? (
            <p className="text-xs leading-5 text-[var(--muted)]">
              Pick a folder, then your browser asks{" "}
              <span className="font-semibold text-[var(--ink)]">
                &ldquo;Allow this site to edit files?&rdquo;
              </span>
              . Choose <span className="font-semibold text-[var(--ink)]">Allow</span>: the site can
              only add files to that one folder. Files are numbered in channel order.
            </p>
          ) : (
            <p className="text-xs leading-5 text-[var(--muted)]">
              Files download one by one like any normal download and land in your Downloads
              folder. If your browser asks to{" "}
              <span className="font-semibold text-[var(--ink)]">download multiple files</span>,
              choose Allow.
            </p>
          )
        ) : null}

        {summary ? (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3 text-sm">
            <p className="text-[var(--ink)]">
              <span className="font-semibold">Set {setIndex + 1} finished:</span> {summary.saved} saved
              {summary.failed ? `, ${summary.failed} failed` : ""}
              {summary.cancelled ? `, ${summary.cancelled} stopped` : ""}.
            </p>
            {failedItems.length ? (
              <button
                type="button"
                onClick={() => downloadSet(failedItems)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink)] underline-offset-2 hover:underline"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Retry failed
              </button>
            ) : null}
            {hasNext ? (
              <button
                type="button"
                onClick={() => showSet(setIndex + 1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink)] underline-offset-2 hover:underline"
              >
                Go to set {setIndex + 2}
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, position) => {
          const key = itemKey(item);
          return (
            <SetItemCard
              key={key}
              item={item}
              position={firstPosition + position}
              checked={selected.has(key)}
              disabled={running}
              state={states[key]}
              href={downloadHref(platform, mode, item, quality)}
              onToggle={() =>
                setSelected((previous) => {
                  const next = new Set(previous);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
            />
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          Set {setIndex + 1}
          {lastSet !== undefined ? ` of ${lastSet + 1}` : ""}
          {lastSet === setIndex ? " · this is the last set" : ""}
        </p>
        {navigation}
      </div>
    </section>
  );
}
