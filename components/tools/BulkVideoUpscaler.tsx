"use client";

import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import JSZip from "jszip";
import { Download, Film, X } from "lucide-react";
import { formatBytes } from "@/components/tools/image/image-utils";

const coreBaseUrl = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
const maximumVideoSize = 250 * 1024 * 1024;
const maximumFiles = 10;
const resolutions = [
  { height: 720, label: "720p HD" },
  { height: 1024, label: "1024 px height" },
  { height: 2160, label: "4K UHD" },
] as const;

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/u, "").replace(/[^a-zA-Z0-9_-]+/gu, "-") || "video";
}

export function BulkVideoUpscaler() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const outputUrlRef = useRef("");
  const runIdRef = useRef(0);
  const [files, setFiles] = useState<File[]>([]);
  const [targetHeight, setTargetHeight] = useState<(typeof resolutions)[number]["height"]>(720);
  const [output, setOutput] = useState<{ url: string; blob: Blob; count: number } | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => {
    runIdRef.current += 1;
    ffmpegRef.current?.terminate();
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
  }, []);

  function clearOutput() {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    outputUrlRef.current = "";
    setOutput(null);
  }

  function chooseFiles(selectedFiles: FileList | null) {
    clearOutput();
    setError("");
    setStatus("");
    setProgress(0);
    const nextFiles = selectedFiles ? Array.from(selectedFiles) : [];
    setFiles(nextFiles.slice(0, maximumFiles));
    if (nextFiles.length > maximumFiles) {
      setError(`Choose up to ${maximumFiles} videos per batch.`);
    }
  }

  function clearAll() {
    clearOutput();
    setFiles([]);
    setError("");
    setStatus("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function loadEngine(ffmpeg: FFmpeg) {
    setStatus("Preparing your videos. This may take a moment.");
    const coreURL = await toBlobURL(`${coreBaseUrl}/ffmpeg-core.js`, "text/javascript");
    const wasmURL = await toBlobURL(`${coreBaseUrl}/ffmpeg-core.wasm`, "application/wasm");
    try {
      await ffmpeg.load({ coreURL, wasmURL });
    } finally {
      URL.revokeObjectURL(coreURL);
      URL.revokeObjectURL(wasmURL);
    }
  }

  async function processVideos() {
    if (!files.length || isWorking) return;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setIsWorking(true);
    setProgress(0);
    setError("");
    setStatus("Starting batch...");
    clearOutput();

    const archive = new JSZip();
    const failures: string[] = [];
    let processed = 0;
    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    try {
      await loadEngine(ffmpeg);
      for (const [index, file] of files.entries()) {
        if (runId !== runIdRef.current) return;
        setStatus(`Processing video ${index + 1} of ${files.length}...`);
        try {
          if (file.type && !file.type.startsWith("video/")) {
            throw new Error("This file is not a video.");
          }
          if (file.size > maximumVideoSize) {
            throw new Error("This video exceeds 250 MB.");
          }

          const inputPath = `/source-${index}.video`;
          const outputPath = `/upscaled-${index}.mp4`;
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
          if (exitCode !== 0) throw new Error("Could not process this video.");
          const data = await ffmpeg.readFile(outputPath);
          if (typeof data === "string") throw new Error("Could not read the processed video.");
          archive.file(`${String(index + 1).padStart(2, "0")}-${baseName(file.name)}-${targetHeight}p.mp4`, new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" }));
          await ffmpeg.deleteFile(outputPath);
          await ffmpeg.deleteFile(inputPath);
          processed += 1;
        } catch (caught) {
          failures.push(`${file.name}: ${caught instanceof Error ? caught.message : "Could not process this file."}`);
        }
        setProgress(Math.round(((index + 1) / files.length) * 100));
      }

      if (runId !== runIdRef.current) return;
      if (processed === 0) throw new Error(failures[0] ?? "No videos could be processed.");
      const blob = await archive.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutput({ url, blob, count: processed });
      setStatus(
        failures.length
          ? `${processed} ${processed === 1 ? "video" : "videos"} ready. ${failures.length} could not be processed: ${failures.slice(0, 3).join(" ")}`
          : `${processed} ${processed === 1 ? "video" : "videos"} ready to download.`,
      );
    } catch (caught) {
      if (runId === runIdRef.current) {
        setError(caught instanceof Error ? caught.message : "Unable to process these videos.");
        setStatus("");
      }
    } finally {
      if (runId === runIdRef.current) {
        ffmpeg.terminate();
        ffmpegRef.current = null;
        setIsWorking(false);
      }
    }
  }

  function cancelProcessing() {
    runIdRef.current += 1;
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
    setIsWorking(false);
    setProgress(0);
    setStatus("Batch cancelled.");
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <div>
            <label htmlFor="bulk-video-files" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Choose videos</label>
            <input
              ref={fileInputRef}
              id="bulk-video-files"
              type="file"
              accept="video/*"
              multiple
              disabled={isWorking}
              onChange={(event) => chooseFiles(event.target.files)}
              className="block min-h-12 w-full cursor-pointer rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--ink)] file:mr-3 file:min-h-12 file:border-0 file:bg-[var(--paper)] file:px-3 file:text-sm file:font-semibold file:text-[var(--ink)] disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">Up to 10 videos · 250 MB each</p>
          </div>

          <label className="block text-sm font-semibold text-[var(--ink)]">
            Output resolution
            <select value={targetHeight} disabled={isWorking} onChange={(event) => setTargetHeight(Number(event.target.value) as (typeof resolutions)[number]["height"])} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]">
              {resolutions.map((resolution) => <option key={resolution.height} value={resolution.height}>{resolution.label}</option>)}
            </select>
          </label>

          <div className="flex gap-3">
            <button type="button" onClick={processVideos} disabled={!files.length || isWorking} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45">
              <Film aria-hidden="true" className="size-4" />
              {isWorking ? "Processing videos" : "Process videos"}
            </button>
            {isWorking ? (
              <button type="button" onClick={cancelProcessing} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" />Cancel</button>
            ) : files.length ? (
              <button type="button" onClick={clearAll} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" />Clear</button>
            ) : null}
          </div>

          {isWorking ? <progress aria-label="Video batch progress" value={progress} max={100} className="h-2 w-full accent-[var(--accent-dark)]" /> : null}
          <p aria-live="polite" className={`min-h-5 text-xs ${error ? "text-red-800" : "text-[var(--muted)]"}`}>{error || status}</p>
          <p className="text-xs leading-5 text-[var(--muted)]">Videos are processed one at a time on your device. Larger output sizes may take longer.</p>
        </div>

        <section aria-labelledby="bulk-video-queue-heading" className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <h3 id="bulk-video-queue-heading" className="text-sm font-semibold text-[var(--ink)]">Batch queue</h3>
            <span className="text-xs text-[var(--muted)]">{files.length} {files.length === 1 ? "file" : "files"}</span>
          </div>
          {files.length ? (
            <ul className="divide-y divide-[var(--line)]">
              {files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-3 py-3 text-xs"><span className="min-w-0 truncate text-[var(--ink)]">{index + 1}. {file.name}</span><span className="shrink-0 text-[var(--muted)]">{formatBytes(file.size)}</span></li>)}
            </ul>
          ) : <p className="py-10 text-center text-sm text-[var(--muted)]">Selected videos will appear here.</p>}
          {output ? (
            <a href={output.url} download="trovflex-videos.zip" className="mt-5 inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-md bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><span className="inline-flex items-center gap-2"><Download aria-hidden="true" className="size-4" />Download ZIP · {output.count} {output.count === 1 ? "video" : "videos"}</span><span className="text-xs font-medium text-white/90">{formatBytes(output.blob.size)}</span></a>
          ) : null}
        </section>
      </div>
    </div>
  );
}