"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ImageIcon,
  LoaderCircle,
  Music2,
  Play,
  Video,
} from "lucide-react";
import type { DownloadOption, DownloadQuality, MediaItem } from "@/lib/social-media";
import { browserDownload, isAbortError, type BatchItemState } from "./batch-download";
import { formatBytes, formatDuration } from "./utils";

/** Thumbnail / player area shared by both card styles. */
function MediaPreview({ item }: { item: MediaItem }) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const duration = formatDuration(item.duration);

  return (
    <div className="relative aspect-video bg-[var(--paper)]">
      {item.embedUrl && !playing ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play preview of ${item.title}`}
          className="group absolute inset-0 size-full"
        >
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
          <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition-colors group-hover:bg-[var(--accent-dark)]">
            <Play aria-hidden="true" className="ml-0.5 size-5 fill-current" />
          </span>
        </button>
      ) : item.embedUrl ? (
        <iframe
          src={`${item.embedUrl}?autoplay=1`}
          title={item.title}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : item.previewUrl && !previewFailed && item.isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.previewUrl}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setPreviewFailed(true)}
          className="absolute inset-0 size-full object-contain"
        />
      ) : item.previewUrl && !previewFailed ? (
        <video
          src={item.previewUrl}
          poster={item.thumbnail}
          controls
          preload="none"
          playsInline
          onError={() => setPreviewFailed(true)}
          className="absolute inset-0 size-full bg-black object-contain"
        />
      ) : item.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)]">
          {item.isImage ? (
            <ImageIcon aria-hidden="true" className="size-8" />
          ) : (
            <Video aria-hidden="true" className="size-8" />
          )}
        </div>
      )}
      {duration ? (
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">
          {duration}
        </span>
      ) : null}
    </div>
  );
}

/** Full card for pasted links: preview plus its own quality picker. */
export function MediaCard({
  item,
  preferAudio,
  hrefFor,
}: {
  item: MediaItem;
  preferAudio: boolean;
  hrefFor: (quality: DownloadQuality) => string;
}) {
  const [download, setDownload] = useState<CardDownload>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const setStarted = (value: false) => {
    if (!value && download.phase !== "active") setDownload({ phase: "idle" });
  };
  const videoOptions = item.options.filter((option) => option.kind !== "audio");
  const audioOptions = item.options.filter((option) => option.kind === "audio");
  // Recommend Full HD (or the best below it) that plays on every device: good
  // quality without a huge file.
  // Labels use the short side ("720p" for a 720×1280 TikTok), so compare those.
  const resolutionOf = (option?: DownloadOption) =>
    option?.value.startsWith("h") ? Number.parseInt(option.label, 10) || 0 : 0;
  const upToFullHd = videoOptions.filter(
    (option) => resolutionOf(option) > 0 && resolutionOf(option) <= 1080,
  );
  const recommended =
    upToFullHd.find((option) => option.playsEverywhere !== false) ??
    videoOptions.find((option) => option.playsEverywhere !== false) ??
    upToFullHd[0] ??
    videoOptions[0];
  const [tab, setTab] = useState<"video" | "audio">(
    (preferAudio && audioOptions.length) || !videoOptions.length ? "audio" : "video",
  );
  const [videoChoice, setVideoChoice] = useState(recommended?.value);
  const [audioChoice, setAudioChoice] = useState(audioOptions[0]?.value);
  const quality: DownloadQuality = (tab === "video" ? videoChoice : audioChoice) ?? "best";
  const selected = item.options.find((option) => option.value === quality);

  const sizeOf = (option: DownloadOption) =>
    formatBytes(
      option.size ??
        // MP3 is converted at about 192 kbit/s, so its size follows the duration.
        (option.value === "mp3" && item.duration ? item.duration * 24_000 : undefined),
    );
  const isLarge = tab === "video" && resolutionOf(selected) >= 1440;
  const selectedSize = selected ? sizeOf(selected) : undefined;
  const buttonText =
    tab === "audio"
      ? `Download audio · ${selected?.label ?? "MP3"}`
      : item.isImage
        ? "Download image"
        : `Download video · ${selected?.label ?? "Best"}`;

  function startDownload(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (download.phase === "active") return;
    const controller = new AbortController();
    abortRef.current = controller;
    setDownload({ phase: "active", preparing: true, received: 0 });
    browserDownload(hrefFor(quality), {
      signal: controller.signal,
      onProgress: (received, total, preparing) =>
        setDownload({ phase: "active", preparing, received, total }),
    })
      .then(() => setDownload({ phase: "done" }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setDownload({
          phase: "failed",
          error: error instanceof Error ? error.message : "Download failed. Please try again.",
        });
      });
  }

  return (
    <li className="@container flex flex-col overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)]">
      <MediaPreview item={item} />

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--ink)]">{item.title}</p>
          {item.uploader ? <p className="mt-0.5 text-xs text-[var(--muted)]">{item.uploader}</p> : null}
        </div>

        <div className="mt-auto space-y-2">
          {videoOptions.length && audioOptions.length ? (
            <div
              role="group"
              aria-label="What to download"
              className="grid grid-cols-2 gap-1 rounded-md bg-[var(--paper)] p-1"
            >
              {(
                [
                  {
                    value: "video",
                    label: item.isImage ? "Image" : "Video",
                    icon: item.isImage ? ImageIcon : Video,
                  },
                  { value: "audio", label: "Audio only", icon: Music2 },
                ] as const
              ).map((choice) => {
                const Icon = choice.icon;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    aria-pressed={tab === choice.value}
                    onClick={() => {
                      setTab(choice.value);
                      setStarted(false);
                    }}
                    className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded text-sm font-semibold transition-colors ${
                      tab === choice.value
                        ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {choice.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {(tab === "video" ? videoOptions : audioOptions).length > 1 ? (
            <QualityChoices
              name={`quality-${item.url}-${item.index ?? 0}-${tab}`}
              legend={tab === "video" ? "Choose quality" : "Choose format"}
              options={tab === "video" ? videoOptions : audioOptions}
              value={quality}
              recommended={tab === "video" ? recommended?.value : undefined}
              sizeOf={sizeOf}
              columns={tab === "video" ? "wide" : "two"}
              onChange={(value) => {
                if (tab === "video") setVideoChoice(value);
                else setAudioChoice(value);
                setStarted(false);
              }}
            />
          ) : null}

          {isLarge ? (
            <p className="text-xs leading-5 text-[var(--muted)]">
              Very large file. 2K and 4K videos may not play on older phones or computers; 1080p
              works for most people.
            </p>
          ) : null}

          <DownloadStatus state={download} />

          <a
            href={hrefFor(quality)}
            download
            onClick={startDownload}
            aria-disabled={download.phase === "active"}
            className={`inline-flex min-h-11 w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-md bg-[var(--ink)] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] ${
              download.phase === "active" ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {download.phase === "active" ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : tab === "audio" ? (
                <Music2 aria-hidden="true" className="size-4" />
              ) : (
                <Download aria-hidden="true" className="size-4" />
              )}
              {download.phase === "active"
                ? "Downloading…"
                : download.phase === "failed"
                  ? "Try again"
                  : buttonText}
            </span>
            {selectedSize && download.phase !== "active" && download.phase !== "failed" ? (
              <span className="font-normal opacity-80">~{selectedSize}</span>
            ) : null}
          </a>
        </div>
      </div>
    </li>
  );
}

type CardDownload =
  | { phase: "idle" }
  | { phase: "active"; preparing: boolean; received: number; total?: number }
  | { phase: "done" }
  | { phase: "failed"; error: string };

/** Progress or result line shown above a card's Download button. */
function DownloadStatus({ state }: { state: CardDownload }) {
  if (state.phase === "idle") return null;
  if (state.phase === "done") {
    return (
      <p className="flex items-start gap-1.5 text-xs leading-5 text-[var(--muted)]">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-green-700" />
        <span>Saved to your computer. You&apos;ll find it in your browser&apos;s downloads.</span>
      </p>
    );
  }
  if (state.phase === "failed") {
    return (
      <p role="alert" className="flex items-start gap-1.5 text-xs leading-5 text-red-800">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>{state.error}</span>
      </p>
    );
  }
  const percent = state.total ? Math.min(100, Math.round((state.received / state.total) * 100)) : undefined;
  return (
    <div aria-live="polite">
      <p className="text-xs leading-5 text-[var(--muted)]">
        {state.preparing
          ? "Getting the video ready… this takes a few seconds."
          : percent !== undefined
            ? `Downloading to your computer… ${percent}%`
            : `Downloading to your computer… ${formatBytes(state.received) ?? ""}`}
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className={`h-full rounded-full bg-[var(--accent-dark)] ${percent === undefined ? "w-1/3 animate-pulse" : "transition-[width]"}`}
          style={percent !== undefined ? { width: `${percent}%` } : undefined}
        />
      </div>
    </div>
  );
}

/** Radio buttons styled as tappable quality cards. */
export function QualityChoices({
  name,
  legend,
  options,
  value,
  recommended,
  sizeOf,
  columns,
  disabled,
  onChange,
}: {
  name: string;
  legend: string;
  options: DownloadOption[];
  value: DownloadQuality;
  recommended?: DownloadQuality;
  sizeOf?: (option: DownloadOption) => string | undefined;
  columns: "two" | "wide";
  disabled?: boolean;
  onChange: (value: DownloadQuality) => void;
}) {
  return (
    <fieldset disabled={disabled} className="disabled:opacity-60">
      <legend className="mb-1.5 text-xs font-semibold text-[var(--muted)]">{legend}</legend>
      <div
        className={`grid gap-2 ${columns === "wide" ? "grid-cols-2 @sm:grid-cols-3 @xl:grid-cols-4" : "grid-cols-2"}`}
      >
        {options.map((option) => {
          const size = sizeOf?.(option);
          return (
            <label
              key={option.value}
              className="relative flex cursor-pointer flex-col rounded-md border border-[var(--line)] px-2.5 py-2 transition-colors hover:border-[var(--accent-dark)] has-[:checked]:border-[var(--accent-dark)] has-[:checked]:bg-[var(--paper)] has-[:checked]:ring-1 has-[:checked]:ring-[var(--accent-dark)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)] has-[:disabled]:cursor-not-allowed"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="text-sm font-semibold text-[var(--ink)]">{option.label}</span>
                {option.value === recommended ? (
                  <span className="rounded-full bg-[var(--accent-dark)] px-1.5 text-[10px] font-semibold leading-4 text-white">
                    Recommended
                  </span>
                ) : null}
              </span>
              <span className="text-xs leading-4 text-[var(--muted)]">
                {option.detail}
                {size ? ` · ${size}` : ""}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Compact card used inside a set of 50: checkbox, preview, status. */
export function SetItemCard({
  item,
  position,
  checked,
  disabled,
  state,
  href,
  onToggle,
}: {
  item: MediaItem;
  position: number;
  checked: boolean;
  disabled: boolean;
  state?: BatchItemState;
  href: string;
  onToggle: () => void;
}) {
  const percent =
    state?.status === "downloading" && state.total
      ? Math.min(100, Math.round((state.received / state.total) * 100))
      : undefined;

  return (
    <li
      className={`flex flex-col overflow-hidden rounded-md border bg-[var(--surface)] transition-colors ${
        checked ? "border-[var(--accent-dark)]" : "border-[var(--line)] opacity-70"
      }`}
    >
      <div className="relative">
        <MediaPreview item={item} />
        <label className="absolute left-2 top-2 flex cursor-pointer items-center gap-1.5 rounded bg-black/70 px-1.5 py-1 text-xs font-semibold text-white">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onToggle}
            className="size-4 accent-[var(--accent)]"
          />
          #{position}
          <span className="sr-only"> select {item.title}</span>
        </label>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-4 text-[var(--ink)]">{item.title}</p>

        <div className="mt-auto">
          {state?.status === "downloading" ? (
            <div>
              <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
                <LoaderCircle aria-hidden="true" className="size-3 animate-spin" />
                {state.preparing
                  ? "Getting the video…"
                  : percent !== undefined
                    ? `Downloading ${percent}%`
                    : `Downloading ${formatBytes(state.received) ?? "…"}`}
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className={`h-full rounded-full bg-[var(--accent-dark)] ${percent === undefined ? "w-1/3 animate-pulse" : ""}`}
                  style={percent !== undefined ? { width: `${percent}%` } : undefined}
                />
              </div>
            </div>
          ) : state?.status === "done" ? (
            <p className="flex items-center gap-1 text-xs font-semibold text-green-700">
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              Saved
            </p>
          ) : state?.status === "failed" ? (
            <p className="flex items-start gap-1 text-xs leading-4 text-red-800" title={state.error}>
              <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className="line-clamp-2">{state.error}</span>
            </p>
          ) : state?.status === "waiting" ? (
            <p className="text-xs text-[var(--muted)]">Waiting…</p>
          ) : (
            <a
              href={href}
              download
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink)] underline-offset-2 hover:underline"
            >
              <Download aria-hidden="true" className="size-3.5" />
              Download only this
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
