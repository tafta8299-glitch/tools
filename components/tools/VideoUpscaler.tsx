"use client";

import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Download, LoaderCircle, Video, X } from "lucide-react";
import { formatBytes } from "@/components/tools/image/image-utils";

const coreBaseUrl = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
const maximumVideoSize = 250 * 1024 * 1024;
const resolutionOptions = [
  { height: 720, label: "720p HD", dimensions: "1280 × 720 at 16:9" },
  { height: 1024, label: "1024 px height", dimensions: "1820 × 1024 at 16:9" },
  { height: 2160, label: "2160p UHD / 4K", dimensions: "3840 × 2160 at 16:9" },
] as const;

type SourceInfo = { width: number; height: number; duration: number };
type VideoOutput = { url: string; blob: Blob; width: number; height: number; name: string };

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function outputDimension(sourceWidth: number, sourceHeight: number, targetHeight: number): number {
  return Math.max(2, Math.round((sourceWidth * targetHeight / sourceHeight) / 2) * 2);
}

function safeBaseName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/u, "")
    .replace(/[^a-zA-Z0-9_-]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "video";
}

export function VideoUpscaler() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputUrlRef = useRef("");
  const outputUrlRef = useRef("");
  const runIdRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null);
  const [targetHeight, setTargetHeight] = useState<(typeof resolutionOptions)[number]["height"]>(720);
  const [output, setOutput] = useState<VideoOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => () => {
    runIdRef.current += 1;
    ffmpegRef.current?.terminate();
    if (inputUrlRef.current) URL.revokeObjectURL(inputUrlRef.current);
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
  }, []);

  function clearOutput() {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    outputUrlRef.current = "";
    setOutput(null);
  }

  function chooseFile(selectedFile: File | undefined) {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
    setStatus("");
    setSourceInfo(null);
    clearOutput();

    if (inputUrlRef.current) URL.revokeObjectURL(inputUrlRef.current);
    inputUrlRef.current = "";
    setInputUrl("");
    setFile(null);

    if (!selectedFile) return;
    if (selectedFile.type && !selectedFile.type.startsWith("video/")) {
      setError("Choose a video file supported by your browser.");
      return;
    }
    if (selectedFile.size > maximumVideoSize) {
      setError("Choose a video smaller than 250 MB for browser processing.");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    inputUrlRef.current = url;
    setInputUrl(url);
    setFile(selectedFile);
  }

  function readSourceInfo(video: HTMLVideoElement) {
    if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) {
      setError("This video does not have readable dimensions or duration.");
      setSourceInfo(null);
      return;
    }
    setError("");
    setSourceInfo({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
    });
  }

  async function loadEngine(ffmpeg: FFmpeg) {
    setStatus("Preparing your video. This may take a moment.");
    const coreURL = await toBlobURL(`${coreBaseUrl}/ffmpeg-core.js`, "text/javascript");
    const wasmURL = await toBlobURL(`${coreBaseUrl}/ffmpeg-core.wasm`, "application/wasm");
    try {
      await ffmpeg.load({ coreURL, wasmURL });
    } finally {
      URL.revokeObjectURL(coreURL);
      URL.revokeObjectURL(wasmURL);
    }
  }

  async function enhanceVideo() {
    if (!file || !sourceInfo || isProcessing) return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setIsProcessing(true);
    setError("");
    setStatus("Preparing video processing...");
    setProgress(0);
    clearOutput();

    const inputPath = "/source-video";
    const outputPath = "/upscaled-video.mp4";
    let ffmpeg = ffmpegRef.current;
    let logListener: ((event: { message: string; type: string }) => void) | null = null;

    try {
      if (!ffmpeg?.loaded) {
        ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;
        await loadEngine(ffmpeg);
      }

      if (runId !== runIdRef.current) return;

      logListener = ({ message }) => {
        const match = message.match(/time=(\d+):(\d+):([\d.]+)/u);
        if (!match) return;
        const elapsed = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
        setProgress(Math.min(99, Math.round((elapsed / sourceInfo.duration) * 100)));
      };
      ffmpeg.on("log", logListener);
      setStatus(`Upscaling video to ${targetHeight === 2160 ? "4K" : `${targetHeight}p`}...`);

      await ffmpeg.writeFile(inputPath, await fetchFile(file));
      const exitCode = await ffmpeg.exec([
        "-i", inputPath,
        "-map", "0:v:0",
        "-map", "0:a?",
        "-vf", `scale=-2:${targetHeight}:flags=lanczos`,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        outputPath,
      ]);

      if (runId !== runIdRef.current) return;
      if (exitCode !== 0) {
        throw new Error("Unable to process this video. Try a shorter clip or a different video file.");
      }

      const data = await ffmpeg.readFile(outputPath);
      if (typeof data === "string") throw new Error("The processed video could not be read.");
      const blob = new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutput({
        url,
        blob,
        width: outputDimension(sourceInfo.width, sourceInfo.height, targetHeight),
        height: targetHeight,
        name: `${safeBaseName(file.name)}-${targetHeight}p.mp4`,
      });
      setProgress(100);
      setStatus("Your upscaled MP4 is ready to preview and download.");
      await ffmpeg.deleteFile(outputPath);
      await ffmpeg.deleteFile(inputPath);
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      ffmpegRef.current?.terminate();
      ffmpegRef.current = null;
      setError(caught instanceof Error ? caught.message : "Unable to upscale this video.");
      setStatus("");
    } finally {
      if (logListener && ffmpegRef.current?.loaded) {
        ffmpegRef.current.off("log", logListener);
      }
      if (runId === runIdRef.current) setIsProcessing(false);
    }
  }

  function cancelProcessing() {
    runIdRef.current += 1;
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
    setIsProcessing(false);
    setProgress(0);
    setStatus("Processing cancelled.");
  }

  function clearAll() {
    clearOutput();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (inputUrlRef.current) URL.revokeObjectURL(inputUrlRef.current);
    inputUrlRef.current = "";
    setInputUrl("");
    setFile(null);
    setSourceInfo(null);
    setStatus("");
    setError("");
    setProgress(0);
  }

  const outputWidth = sourceInfo
    ? outputDimension(sourceInfo.width, sourceInfo.height, targetHeight)
    : 0;

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <div>
            <label htmlFor="video-upscale-file" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
              Video file
            </label>
            <input
              ref={fileInputRef}
              id="video-upscale-file"
              type="file"
              accept="video/*"
              disabled={isProcessing}
              onChange={(event) => chooseFile(event.target.files?.[0])}
              className="block min-h-12 w-full cursor-pointer rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--ink)] file:mr-3 file:min-h-12 file:border-0 file:bg-[var(--paper)] file:px-3 file:text-sm file:font-semibold file:text-[var(--ink)] disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">Maximum file size: 250 MB.</p>
          </div>

          {sourceInfo ? (
            <p className="text-xs text-[var(--muted)]">
              Source: {sourceInfo.width} × {sourceInfo.height} px · {formatDuration(sourceInfo.duration)} · {file ? formatBytes(file.size) : ""}
            </p>
          ) : null}

          <div>
            <label htmlFor="video-upscale-resolution" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
              Output resolution
            </label>
            <select
              id="video-upscale-resolution"
              value={targetHeight}
              disabled={isProcessing}
              onChange={(event) => {
                setTargetHeight(Number(event.target.value) as (typeof resolutionOptions)[number]["height"]);
                clearOutput();
              }}
              className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] disabled:opacity-50"
            >
              {resolutionOptions.map((option) => (
                <option key={option.height} value={option.height}>
                  {option.label} · {option.dimensions}
                </option>
              ))}
            </select>
            {sourceInfo ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Output: {outputWidth} × {targetHeight} px. Original aspect ratio is preserved.
              </p>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={enhanceVideo}
              disabled={!file || !sourceInfo || isProcessing}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Video aria-hidden="true" className="size-4" />}
              {isProcessing ? "Processing video" : "Upscale video"}
            </button>
            {isProcessing ? (
              <button
                type="button"
                onClick={cancelProcessing}
                aria-label="Cancel video processing"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--paper)]"
              >
                <X aria-hidden="true" className="size-4" />
                Cancel
              </button>
            ) : file ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--paper)]"
              >
                <X aria-hidden="true" className="size-4" />
                Clear video
              </button>
            ) : null}
          </div>

          {isProcessing ? (
            <div className="space-y-2">
              <progress
                aria-label="Video processing progress"
                value={progress || undefined}
                max={100}
                className="h-2 w-full accent-[var(--accent-dark)]"
              />
              <p aria-live="polite" className="text-xs text-[var(--muted)]">{status}</p>
            </div>
          ) : (
            <p aria-live="polite" className={`min-h-5 text-xs ${error ? "text-red-700" : "text-[var(--muted)]"}`}>
              {error || status}
            </p>
          )}

          <p className="text-xs leading-5 text-[var(--muted)]">
            Your video stays on your device. Larger output sizes may take longer to process.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <VideoPreview
            label="Original"
            src={inputUrl}
            onLoadedMetadata={(event) => readSourceInfo(event.currentTarget)}
            onError={() => setError("This browser could not preview the selected video. Try an MP4 or WebM file.")}
            width={sourceInfo?.width}
            height={sourceInfo?.height}
          />
          <VideoPreview
            label="Upscaled"
            src={output?.url ?? ""}
            width={output?.width}
            height={output?.height}
          />
          {output ? (
            <div className="sm:col-span-2">
              <a
                href={output.url}
                download={output.name}
                className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-md bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Download aria-hidden="true" className="size-4 shrink-0" />
                  Download MP4
                </span>
                <span className="text-sm font-medium text-white/90">{formatBytes(output.blob.size)}</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function VideoPreview({
  label,
  src,
  onLoadedMetadata,
  onError,
  width,
  height,
}: {
  label: string;
  src: string;
  onLoadedMetadata?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onError?: () => void;
  width?: number;
  height?: number;
}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">{label}</h3>
      <div className="grid aspect-video place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
        {src ? (
          <video
            src={src}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={onLoadedMetadata}
            onError={onError}
            className="h-full w-full object-contain"
          />
        ) : (
          <p className="px-4 text-center text-sm text-[var(--muted)]">{label} preview appears here.</p>
        )}
      </div>
      {width && height ? <p className="mt-2 text-xs text-[var(--muted)]">{width} × {height} px</p> : null}
    </section>
  );
}