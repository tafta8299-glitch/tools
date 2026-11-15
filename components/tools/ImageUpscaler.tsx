"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, formatBytes, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

type Scale = 2 | 3 | 4;
type Format = "image/png" | "image/jpeg" | "image/webp";

export function ImageUpscaler() {
  const { asset, error, selectFile, clear: clearSource } = useImageAsset();
  const [scale, setScale] = useState<Scale>(2);
  const [format, setFormat] = useState<Format>("image/png");
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null);
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");
  const width = (asset?.width ?? 0) * scale;
  const height = (asset?.height ?? 0) * scale;
  const withinPixelLimit = width * height <= 40_000_000 && width <= 10000 && height <= 10000;

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
  }

  async function upscale() {
    if (!asset || !withinPixelLimit) return;
    try {
      const canvas = makeCanvas(width, height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(asset.image, 0, 0, width, height);
      const blob = await canvasToBlob(canvas, format, quality / 100);
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, width, height });
      setFeedback("Upscaled image is ready to download.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to upscale this image.");
    }
  }

  function clearAll() {
    clearResult();
    clearSource();
    setFeedback("");
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <ImageFilePicker id="upscale-image-file" onSelect={(file) => { clearResult(); setFeedback(""); void selectFile(file); }} />
          {asset && <p className="text-xs text-[var(--muted)]">Source: {asset.width} × {asset.height} px</p>}
          <div>
            <label htmlFor="upscale-factor" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Upscale factor</label>
            <select id="upscale-factor" value={scale} onChange={(event) => { setScale(Number(event.target.value) as Scale); clearResult(); }} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none">
              <option value={2}>2× · {asset ? `${width} × ${height}` : "double dimensions"}</option>
              <option value={3}>3× · {asset ? `${asset.width * 3} × ${asset.height * 3}` : "triple dimensions"}</option>
              <option value={4}>4× · {asset ? `${asset.width * 4} × ${asset.height * 4}` : "quadruple dimensions"}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[var(--muted)]">Format<select value={format} onChange={(event) => setFormat(event.target.value as Format)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm font-normal text-[var(--ink)]"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
            {format !== "image/png" && <label className="text-xs font-semibold text-[var(--muted)]">Quality: {quality}%<input type="range" min="40" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-4 h-2 w-full accent-[var(--accent-dark)]" /></label>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={upscale} disabled={!asset || !withinPixelLimit} className="min-h-10 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">Upscale image</button>
            {asset && <button type="button" onClick={clearAll} aria-label="Clear image" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}
          </div>
          <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback || (asset && !withinPixelLimit ? "Output is limited to 40 megapixels and 10,000 px per side." : "")}</p>
          <p className="text-xs leading-5 text-[var(--muted)]">Enlarges the image smoothly. No AI is used, so it can&apos;t add details that weren&apos;t in the original.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePane label="Original" src={asset?.previewUrl} width={asset?.width} height={asset?.height} />
          <ImagePane label="Upscaled" src={result?.url} width={result?.width} height={result?.height} />
          {result && asset && (
            <div className="sm:col-span-2">
              <a
                href={result.url}
                download={`${getBaseName(asset.file.name)}-${scale}x.${format === "image/jpeg" ? "jpg" : format.split("/")[1]}`}
                className="inline-flex w-full min-h-12 items-center justify-between gap-3 rounded-md bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Download aria-hidden="true" className="size-4 shrink-0" />
                  Download
                </span>
                <span className="text-sm font-medium text-white/90">{formatBytes(result.blob.size)}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePane({ label, src, width, height }: { label: string; src?: string; width?: number; height?: number }) {
  return <section className="min-w-0"><h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">{label}</h3><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">{src ? <Image src={src} alt={`${label} preview`} width={width || 640} height={height || 480} unoptimized className="h-full w-full object-contain" /> : <p className="px-4 text-center text-sm text-[var(--muted)]">{label} preview appears here.</p>}</div>{width && height && <p className="mt-2 text-xs text-[var(--muted)]">{width} × {height} px</p>}</section>;
}