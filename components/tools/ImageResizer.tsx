"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, formatBytes, getImageExtension, makeCanvas } from "@/components/tools/image/image-utils";

type ResizeMode = "pixels" | "percentage";
type Format = "image/png" | "image/jpeg" | "image/webp";

export function ImageResizer() {
  const { asset, error, selectFile, clear: clearSource } = useImageAsset();
  const [mode, setMode] = useState<ResizeMode>("pixels");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [percentage, setPercentage] = useState(50);
  const [keepRatio, setKeepRatio] = useState(true);
  const [format, setFormat] = useState<Format>("image/png");
  const [quality, setQuality] = useState(88);
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null);
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");
  const width = mode === "percentage" ? Math.round((asset?.width ?? 0) * percentage / 100) : Number(customWidth || asset?.width || 0);
  const height = mode === "percentage" ? Math.round((asset?.height ?? 0) * percentage / 100) : Number(customHeight || asset?.height || 0);
  const validDimensions = width > 0 && height > 0 && width <= 10000 && height <= 10000;

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
  }

  function chooseFile(file?: File) {
    clearResult();
    setCustomWidth("");
    setCustomHeight("");
    setFeedback("");
    void selectFile(file);
  }

  function changeWidth(nextWidth: string) {
    setCustomWidth(nextWidth);
    if (keepRatio && asset && Number(nextWidth) > 0) {
      setCustomHeight(String(Math.round(Number(nextWidth) * asset.height / asset.width)));
    }
  }

  function changeHeight(nextHeight: string) {
    setCustomHeight(nextHeight);
    if (keepRatio && asset && Number(nextHeight) > 0) {
      setCustomWidth(String(Math.round(Number(nextHeight) * asset.width / asset.height)));
    }
  }

  async function resizeImage() {
    if (!asset || !validDimensions) return;

    try {
      const canvas = makeCanvas(width, height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(asset.image, 0, 0, width, height);
      const blob = await canvasToBlob(canvas, format, quality / 100);
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, width, height });
      setFeedback("Resized image is ready to download.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to resize this image.");
    }
  }

  function clearAll() {
    clearResult();
    clearSource();
    setFeedback("");
    setCustomWidth("");
    setCustomHeight("");
  }

  const savedPercentage = asset && result && asset.file.size > 0
    ? Math.max(0, Math.round((1 - result.blob.size / asset.file.size) * 100))
    : 0;

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <ImageFilePicker id="resize-image-file" onSelect={chooseFile} />
          {asset && <p className="text-xs text-[var(--muted)]">Original: {asset.width} × {asset.height} px · {formatBytes(asset.file.size)}</p>}
          {asset && (
            <div className="inline-flex rounded-md border border-[var(--line)] bg-[var(--paper)] p-1" role="group" aria-label="Resize input mode">
              {(["pixels", "percentage"] as const).map((option) => (
                <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)} className={`min-h-9 rounded-sm px-3 text-sm font-semibold capitalize ${mode === option ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"}`}>{option}</button>
              ))}
            </div>
          )}
          {asset && (mode === "pixels" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-[var(--muted)]">Width (px)<input type="number" min="1" max="10000" value={customWidth || asset.width} onChange={(event) => changeWidth(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]" /></label>
                <label className="text-xs font-semibold text-[var(--muted)]">Height (px)<input type="number" min="1" max="10000" value={customHeight || asset.height} onChange={(event) => changeHeight(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]" /></label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><input type="checkbox" checked={keepRatio} onChange={(event) => setKeepRatio(event.target.checked)} className="size-4 accent-[var(--accent-dark)]" />Lock aspect ratio</label>
            </div>
          ) : (
            <label className="block text-sm font-semibold text-[var(--ink)]">Scale: {percentage}%<input type="range" min="10" max="400" value={percentage} onChange={(event) => setPercentage(Number(event.target.value))} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>
          ))}
          {asset && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[var(--muted)]">Format<select value={format} onChange={(event) => setFormat(event.target.value as Format)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
              {format !== "image/png" && <label className="text-xs font-semibold text-[var(--muted)]">Quality: {quality}%<input type="range" min="40" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-4 h-2 w-full accent-[var(--accent-dark)]" /></label>}
            </div>
          )}
          {asset && <div className="flex gap-3"><button type="button" onClick={resizeImage} disabled={!validDimensions} className="min-h-10 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">Resize image</button><button type="button" onClick={clearAll} aria-label="Clear image" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button></div>}
          <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback || (asset && !validDimensions ? "Dimensions must be between 1 and 10,000 pixels." : "")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePreview label="Original" src={asset?.previewUrl} width={asset?.width} height={asset?.height} />
          <ImagePreview label="Resized" src={result?.url} width={result?.width} height={result?.height} />
          {result && asset && (
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:col-span-2">
              <a href={result.url} download={`${asset.file.name.replace(/\.[^.]+$/u, "")}-${result.width}x${result.height}.${getImageExtension(format)}`} className="inline-flex min-h-10 w-full flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] sm:w-auto">
                <Download aria-hidden="true" className="size-4 shrink-0" />
                Download resized image · {formatBytes(result.blob.size)}
              </a>
              <p className="text-xs text-[var(--muted)]">{savedPercentage > 0 ? `${savedPercentage}% smaller` : "No size reduction"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ label, src, width, height }: { label: string; src?: string; width?: number; height?: number }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">{label}</h3>
      <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
        {src ? <Image src={src} alt={`${label} preview`} width={width || 640} height={height || 480} unoptimized className="h-full w-full object-contain" /> : <p className="px-4 text-center text-sm text-[var(--muted)]">{label} preview appears here.</p>}
      </div>
      {width && height && <p className="mt-2 text-xs text-[var(--muted)]">{width} × {height} px</p>}
    </section>
  );
}