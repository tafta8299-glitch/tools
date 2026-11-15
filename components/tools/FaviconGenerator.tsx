"use client";

import { useState } from "react";
import JSZip from "jszip";
import { Download } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, drawCover, makeCanvas } from "@/components/tools/image/image-utils";

const iconSizes = [16, 32, 48, 180, 192, 512];

function makeIco(png: Uint8Array): Blob {
  const ico = new Uint8Array(22 + png.length);
  const view = new DataView(ico.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  ico[6] = 32;
  ico[7] = 32;
  ico[8] = 0;
  ico[9] = 0;
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, png.length, true);
  view.setUint32(18, 22, true);
  ico.set(png, 22);
  return new Blob([ico], { type: "image/x-icon" });
}

export function FaviconGenerator() {
  const { asset, error, selectFile, clear } = useImageAsset();
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [feedback, setFeedback] = useState("");

  async function generate() {
    if (!asset) return;
    setIsGenerating(true);
    setFeedback("");
    try {
      const zip = new JSZip();
      let icoBlob: Blob | undefined;
      const manifestIcons: { src: string; sizes: string; type: string }[] = [];

      for (const size of iconSizes) {
        const canvas = makeCanvas(size, size);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas rendering is unavailable.");
        drawCover(context, asset.image, asset.width, asset.height, size, size);
        const blob = await canvasToBlob(canvas, "image/png");
        const bytes = new Uint8Array(await blob.arrayBuffer());
        zip.file(`favicon-${size}x${size}.png`, bytes);
        manifestIcons.push({ src: `favicon-${size}x${size}.png`, sizes: `${size}x${size}`, type: "image/png" });
        if (size === 32) icoBlob = makeIco(bytes);
      }

      if (icoBlob) zip.file("favicon.ico", await icoBlob.arrayBuffer());
      zip.file("site.webmanifest", JSON.stringify({ name: "Website", short_name: "Website", icons: manifestIcons, display: "standalone" }, null, 2));
      const archive = await zip.generateAsync({ type: "blob" });
      setResultUrl(URL.createObjectURL(archive));
      setFeedback("Favicon set is ready to download.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to generate favicon files.");
    } finally {
      setIsGenerating(false);
    }
  }

  function clearAll() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl("");
    setFeedback("");
    clear();
  }

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <div className="space-y-5">
        <ImageFilePicker id="favicon-source" onSelect={(file) => { setResultUrl(""); setFeedback(""); void selectFile(file); }} />
        {asset && <p className="text-xs text-[var(--muted)]">Source image: {asset.width} × {asset.height} px</p>}
        <button type="button" onClick={generate} disabled={!asset || isGenerating} className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">{isGenerating ? "Generating icon set..." : "Generate favicon set"}</button>
        {asset && <button type="button" onClick={clearAll} className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Clear image and result</button>}
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
        <p className="text-xs leading-5 text-[var(--muted)]">The ZIP contains PNG sizes 16, 32, 48, 180, 192, and 512 px, a favicon.ico, and a web manifest.</p>
        {resultUrl && <a href={resultUrl} download="favicon-set.zip" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><Download aria-hidden="true" className="size-4" />Download favicon set</a>}
      </div>
      <div className="min-w-0 max-w-full">
        <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Icon preview</h3>
        <div className="flex max-w-full flex-wrap items-end gap-4 rounded-md border border-[var(--line)] bg-[var(--paper)] p-4 sm:gap-5 sm:p-6">
          {iconSizes.map((size) => {
            const previewSize = Math.min(64, size);
            return <div key={size} className="flex flex-col items-center gap-2"><div className="grid place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] p-3" style={{ width: previewSize + 24, height: previewSize + 24 }}>{asset && <canvas ref={(canvas) => { if (!canvas || !asset) return; canvas.width = size; canvas.height = size; const context = canvas.getContext("2d"); if (context) drawCover(context, asset.image, asset.width, asset.height, size, size); }} style={{ width: previewSize, height: previewSize }} />}</div><span className="text-xs text-[var(--muted)]">{size}px</span></div>;
          })}
        </div>
      </div>
    </div>
  );
}