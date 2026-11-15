"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, drawContain, drawCover, formatBytes, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

const presets = [
  { label: "Instagram square", width: 1080, height: 1080 },
  { label: "Instagram portrait", width: 1080, height: 1350 },
  { label: "Instagram story", width: 1080, height: 1920 },
  { label: "Facebook post", width: 1200, height: 630 },
  { label: "YouTube thumbnail", width: 1280, height: 720 },
  { label: "X post", width: 1600, height: 900 },
  { label: "LinkedIn cover", width: 1584, height: 396 },
] as const;

type Fit = "cover" | "contain";

export function SocialImageResizer() {
  const { asset, error, selectFile, clear: clearSource } = useImageAsset();
  const [presetIndex, setPresetIndex] = useState(0);
  const [fit, setFit] = useState<Fit>("cover");
  const [background, setBackground] = useState("#ffffff");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");
  const preset = presets[presetIndex];

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
  }

  async function createImage() {
    if (!asset) return;
    try {
      const canvas = makeCanvas(preset.width, preset.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      const draw = fit === "cover" ? drawCover : drawContain;
      draw(context, asset.image, asset.width, asset.height, preset.width, preset.height);
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url });
      setFeedback(`${preset.label} image is ready.`);
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to resize this image.");
    }
  }

  function clearAll() {
    clearResult();
    clearSource();
    setFeedback("");
  }

  return (
    <div className="grid gap-7 pt-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-5">
        <ImageFilePicker id="social-image-file" onSelect={(file) => { clearResult(); setFeedback(""); void selectFile(file); }} />
        {asset && <p className="text-xs text-[var(--muted)]">Source: {asset.width} × {asset.height} px</p>}
        <div>
          <label htmlFor="social-preset" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Platform size</label>
          <select id="social-preset" value={presetIndex} onChange={(event) => { setPresetIndex(Number(event.target.value)); clearResult(); }} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none">
            {presets.map((option, index) => <option key={option.label} value={index}>{option.label} · {option.width} × {option.height}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[var(--ink)]">Image fit</legend>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Image fit">
            {(["cover", "contain"] as const).map((option) => <button key={option} type="button" aria-pressed={fit === option} onClick={() => { setFit(option); clearResult(); }} className={`min-h-10 rounded-md border text-sm font-semibold capitalize ${fit === option ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}>{option === "cover" ? "Fill and crop" : "Fit with background"}</button>)}
          </div>
        </fieldset>
        {fit === "contain" && <label className="inline-flex items-center gap-2.5 text-sm text-[var(--muted)]"><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} aria-label="Background color" className="size-9 rounded border border-[var(--line)] p-1" />Background color</label>}
        <div className="flex gap-3">
          <button type="button" onClick={createImage} disabled={!asset} className="min-h-10 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">Create image</button>
          {asset && <button type="button" onClick={clearAll} aria-label="Clear image" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}
        </div>
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
      </div>
      <div className="space-y-3">
        <div className="grid aspect-video place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]" style={{ aspectRatio: `${preset.width} / ${preset.height}` }}>
          {result ? <Image src={result.url} alt={`${preset.label} preview`} width={preset.width} height={preset.height} unoptimized className="h-full w-full object-contain" /> : asset ? <div className="relative h-full w-full overflow-hidden"><Image src={asset.previewUrl} alt="Source image preview" fill unoptimized className={fit === "cover" ? "object-cover" : "object-contain"} /></div> : <p className="px-4 text-center text-sm text-[var(--muted)]">Choose a photo to preview the target size.</p>}
        </div>
        <p className="text-xs text-[var(--muted)]">{preset.width} × {preset.height} px · {preset.label}</p>
        {result && <a href={result.url} download={`${asset ? getBaseName(asset.file.name) : "image"}-${preset.width}x${preset.height}.jpg`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><Download aria-hidden="true" className="size-4" />Download · {formatBytes(result.blob.size)}</a>}
      </div>
    </div>
  );
}