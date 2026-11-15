"use client";

import { useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Download, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, formatBytes, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

const ratios = [
  { label: "Free", value: "free", aspect: undefined },
  { label: "Square 1:1", value: "1:1", aspect: 1 },
  { label: "Portrait 4:5", value: "4:5", aspect: 4 / 5 },
  { label: "Photo 4:3", value: "4:3", aspect: 4 / 3 },
  { label: "Widescreen 16:9", value: "16:9", aspect: 16 / 9 },
  { label: "Story 9:16", value: "9:16", aspect: 9 / 16 },
] as const;

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

export function ImageCropper() {
  const { asset, error, selectFile, clear: clearSource } = useImageAsset();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<(typeof ratios)[number]["value"]>("1:1");
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null);
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
  }

  function chooseFile(file?: File) {
    clearResult();
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropArea(null);
    setFeedback("");
    void selectFile(file);
  }

  async function exportCrop() {
    if (!asset || !cropArea) return;
    try {
      const canvas = makeCanvas(cropArea.width, cropArea.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(asset.image, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas, format, 0.92);
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, width: canvas.width, height: canvas.height });
      setFeedback("Crop is ready to download.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to crop this image.");
    }
  }

  function clearAll() {
    clearResult();
    clearSource();
    setCropArea(null);
    setFeedback("");
  }

  const aspect = ratios.find((option) => option.value === ratio)?.aspect;
  const extension = format === "image/jpeg" ? "jpg" : format.split("/")[1];

  return (
    <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:gap-8">
      <div className="space-y-5">
        <ImageFilePicker id="crop-image-file" onSelect={chooseFile} />
        {asset && <p className="text-xs text-[var(--muted)]">{asset.width} × {asset.height} px · {formatBytes(asset.file.size)}</p>}
        <div>
          <label htmlFor="crop-ratio" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Aspect ratio</label>
          <select id="crop-ratio" value={ratio} onChange={(event) => { setRatio(event.target.value as typeof ratio); clearResult(); }} disabled={!asset} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] disabled:opacity-50">
            {ratios.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <label className="block text-sm font-semibold text-[var(--ink)]">Zoom: {zoom.toFixed(1)}×<input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(event) => { setZoom(Number(event.target.value)); clearResult(); }} disabled={!asset} className="mt-3 h-2 w-full accent-[var(--accent-dark)] disabled:opacity-50" /></label>
        <div>
          <label htmlFor="crop-format" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Export format</label>
          <select id="crop-format" value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} disabled={!asset} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none disabled:opacity-50"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={exportCrop} disabled={!asset || !cropArea} className="min-h-10 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">Apply crop</button>
          {asset && <button type="button" onClick={clearAll} aria-label="Clear image" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}
        </div>
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
      </div>

      <div className="space-y-3">
        <div className="relative h-72 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--ink)] sm:h-96">
          {asset ? <Cropper image={asset.previewUrl} crop={crop} zoom={zoom} aspect={aspect} onCropChange={(nextCrop) => { setCrop(nextCrop); clearResult(); }} onZoomChange={(nextZoom) => { setZoom(nextZoom); clearResult(); }} onCropComplete={(_area, pixels) => setCropArea(pixels)} /> : <div className="grid h-full place-items-center px-6 text-center text-sm text-white/70">Choose an image to set the crop area.</div>}
        </div>
        {result && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm"><span>{result.width} × {result.height} px · {formatBytes(result.blob.size)}</span><a href={result.url} download={`${asset ? getBaseName(asset.file.name) : "image"}-cropped.${extension}`} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[var(--ink)] px-3 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><Download aria-hidden="true" className="size-4" />Download</a></div>}
      </div>
    </div>
  );
}