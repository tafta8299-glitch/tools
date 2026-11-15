"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Image from "next/image";
import { Download, Pipette, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, formatBytes, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

type RGB = [number, number, number];

function toHex([red, green, blue]: RGB): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function BackgroundRemover() {
  const { asset, error, selectFile, clear: clearSource } = useImageAsset();
  const [background, setBackground] = useState<RGB | null>(null);
  const [tolerance, setTolerance] = useState(40);
  const [softness, setSoftness] = useState(12);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
  }

  function chooseFile(file?: File) {
    clearResult();
    setBackground(null);
    setFeedback("");
    void selectFile(file);
  }

  function sampleBackground(event: ReactMouseEvent<HTMLButtonElement>) {
    if (!asset) return;
    const preview = event.currentTarget.querySelector("img");
    if (!preview) return;
    const bounds = preview.getBoundingClientRect();
    const x = Math.max(0, Math.min(asset.width - 1, Math.floor((event.clientX - bounds.left) / bounds.width * asset.width)));
    const y = Math.max(0, Math.min(asset.height - 1, Math.floor((event.clientY - bounds.top) / bounds.height * asset.height)));
    const canvas = makeCanvas(1, 1);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(asset.image, x, y, 1, 1, 0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    setBackground([red, green, blue]);
    clearResult();
    setFeedback("Background color sampled. Adjust tolerance, then remove it.");
  }

  async function removeBackground() {
    if (!asset || !background) {
      setFeedback("Select an image, then click its background to sample a color.");
      return;
    }
    if (asset.width * asset.height > 40_000_000) {
      setFeedback("This image is very large. Resize it below 40 megapixels first.");
      return;
    }

    try {
      const canvas = makeCanvas(asset.width, asset.height);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Your browser can't edit images here. Try another browser.");
      context.drawImage(asset.image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const [targetRed, targetGreen, targetBlue] = background;

      for (let offset = 0; offset < pixels.data.length; offset += 4) {
        const distance = Math.max(
          Math.abs(pixels.data[offset] - targetRed),
          Math.abs(pixels.data[offset + 1] - targetGreen),
          Math.abs(pixels.data[offset + 2] - targetBlue),
        );

        if (distance <= tolerance) {
          pixels.data[offset + 3] = 0;
        } else if (softness > 0 && distance < tolerance + softness) {
          pixels.data[offset + 3] = Math.round(pixels.data[offset + 3] * (distance - tolerance) / softness);
        }
      }

      context.putImageData(pixels, 0, 0);
      const blob = await canvasToBlob(canvas, "image/png");
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url });
      setFeedback("Background color removed. Download the transparent PNG.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to remove the selected color.");
    }
  }

  function clearAll() {
    clearResult();
    clearSource();
    setBackground(null);
    setFeedback("");
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-5">
          <ImageFilePicker id="background-image-file" onSelect={chooseFile} />
          {asset && <p className="text-xs text-[var(--muted)]">{asset.width} × {asset.height} px · {formatBytes(asset.file.size)}</p>}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">Sampled background</label>
            <div className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3">
              <span className="size-6 rounded-sm border border-black/10" style={{ backgroundColor: background ? toHex(background) : "transparent" }} />
              <span className="font-mono text-sm text-[var(--ink)]">{background ? toHex(background) : "Click the image to sample"}</span>
            </div>
          </div>
          <label className="block text-sm font-semibold text-[var(--ink)]">Color tolerance: {tolerance}<input type="range" min="0" max="180" value={tolerance} onChange={(event) => { setTolerance(Number(event.target.value)); clearResult(); }} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>
          <label className="block text-sm font-semibold text-[var(--ink)]">Edge softness: {softness}<input type="range" min="0" max="60" value={softness} onChange={(event) => { setSoftness(Number(event.target.value)); clearResult(); }} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>
          <div className="flex gap-3">
            <button type="button" onClick={removeBackground} disabled={!asset || !background} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45"><Pipette aria-hidden="true" className="size-4" />Remove sampled color</button>
            {asset && <button type="button" onClick={clearAll} aria-label="Clear image" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}
          </div>
          <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
          <p className="text-xs leading-5 text-[var(--muted)]">This removes a sampled solid color throughout the image; it is not AI subject detection.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <section><h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">Source · click to sample</h3><button type="button" disabled={!asset} onClick={sampleBackground} aria-label="Sample background color from image" className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)] disabled:cursor-default">{asset ? <Image src={asset.previewUrl} alt="Click a background color to sample it" width={asset.width} height={asset.height} unoptimized className="h-full w-full cursor-crosshair object-contain" /> : <span className="text-sm text-[var(--muted)]">Choose an image to preview.</span>}</button></section>
          <section><h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">Transparent result</h3><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[linear-gradient(45deg,#e8ece9_25%,transparent_25%),linear-gradient(-45deg,#e8ece9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e8ece9_75%),linear-gradient(-45deg,transparent_75%,#e8ece9_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0]">{result ? <Image src={result.url} alt="Background-removed transparent PNG preview" width={asset?.width || 640} height={asset?.height || 480} unoptimized className="h-full w-full object-contain" /> : <span className="text-sm text-[var(--muted)]">Transparent PNG appears here.</span>}</div>{result && <a href={result.url} download={`${asset ? getBaseName(asset.file.name) : "image"}-transparent.png`} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><Download aria-hidden="true" className="size-4" />Download PNG · {formatBytes(result.blob.size)}</a>}</section>
        </div>
      </div>
    </div>
  );
}