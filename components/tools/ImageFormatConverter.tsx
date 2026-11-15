"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, formatBytes, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

type Format = "image/png" | "image/jpeg" | "image/webp";

export function ImageFormatConverter() {
  const { asset, error, selectFile, clear: clearSource } = useImageAsset();
  const [format, setFormat] = useState<Format>("image/webp");
  const [quality, setQuality] = useState(88);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");

  function resetResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
  }

  function chooseFile(file?: File) {
    resetResult();
    setFeedback("");
    void selectFile(file);
  }

  async function convert() {
    if (!asset) return;
    try {
      const canvas = makeCanvas(asset.width, asset.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(asset.image, 0, 0);
      const blob = await canvasToBlob(canvas, format, quality / 100);
      resetResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url });
      setFeedback(`${asset.width} × ${asset.height} image converted to ${format.replace("image/", "").toUpperCase()}.`);
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "This format is not supported by the browser.");
    }
  }

  function clearAll() {
    resetResult();
    clearSource();
    setFeedback("");
  }

  const extension = format === "image/jpeg" ? "jpg" : format.split("/")[1];

  return (
    <div className="grid gap-7 pt-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-5">
        <ImageFilePicker id="format-image-file" onSelect={chooseFile} />
        {asset && <p className="text-xs text-[var(--muted)]">{asset.width} × {asset.height} px · {formatBytes(asset.file.size)}</p>}
        <div>
          <label htmlFor="conversion-format" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Convert to</label>
          <select id="conversion-format" value={format} onChange={(event) => { setFormat(event.target.value as Format); resetResult(); }} disabled={!asset} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] disabled:opacity-50">
            <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
          </select>
        </div>
        {format !== "image/png" && <label className="block text-sm font-semibold text-[var(--ink)]">Quality: {quality}%<input type="range" min="40" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>}
        <div className="flex gap-3">
          <button type="button" onClick={convert} disabled={!asset} className="min-h-10 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">Convert image</button>
          {asset && <button type="button" onClick={clearAll} aria-label="Clear image" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}
        </div>
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageCard label="Original" src={asset?.previewUrl} width={asset?.width} height={asset?.height} />
        <ImageCard label="Converted" src={result?.url} width={asset?.width} height={asset?.height} />
        {result && asset && (
          <div className="sm:col-span-2">
            <a
              href={result.url}
              download={`${getBaseName(asset.file.name)}.${extension}`}
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
  );
}

function ImageCard({ label, src, width, height }: { label: string; src?: string; width?: number; height?: number }) {
  return <section className="min-w-0"><h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">{label}</h3><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">{src ? <Image src={src} alt={`${label} preview`} width={width || 640} height={height || 480} unoptimized className="h-full w-full object-contain" /> : <p className="px-4 text-center text-sm text-[var(--muted)]">{label} preview appears here.</p>}</div></section>;
}