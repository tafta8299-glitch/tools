"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

type Frame = "browser" | "phone" | "none";

const backgrounds = ["#F1F0E8", "#E7EDF2", "#DDE9E1", "#F4DFD2", "#242A31", "#FFFFFF"];

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

export function ScreenshotBeautifier() {
  const { asset, error, selectFile, clear } = useImageAsset();
  const [frame, setFrame] = useState<Frame>("browser");
  const [background, setBackground] = useState(backgrounds[0]);
  const [padding, setPadding] = useState(48);
  const [cornerRadius, setCornerRadius] = useState(16);
  const [address, setAddress] = useState("your-project.example");
  const [resultUrl, setResultUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResultUrl("");
  }

  async function createMockup() {
    if (!asset) return;
    try {
      const frameBar = frame === "browser" ? 56 : frame === "phone" ? 44 : 0;
      const phoneInset = frame === "phone" ? 14 : 0;
      const outerPadding = frame === "none" ? 0 : padding;
      const canvasWidth = asset.width + outerPadding * 2 + phoneInset * 2;
      const canvasHeight = asset.height + outerPadding * 2 + frameBar + phoneInset * 2;
      if (canvasWidth > 10000 || canvasHeight > 10000) {
        throw new Error("This screenshot is too large to frame. Resize it first.");
      }

      const canvas = makeCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (frame === "browser") {
        const x = outerPadding;
        const y = outerPadding;
        const totalHeight = frameBar + asset.height;
        context.shadowColor = "rgba(0, 0, 0, 0.18)";
        context.shadowBlur = 28;
        context.shadowOffsetY = 12;
        roundedRect(context, x, y, asset.width, totalHeight, cornerRadius);
        context.fillStyle = "#ffffff";
        context.fill();
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
        context.save();
        roundedRect(context, x, y, asset.width, totalHeight, cornerRadius);
        context.clip();
        context.fillStyle = "#f3f4f3";
        context.fillRect(x, y, asset.width, frameBar);
        ["#f16b62", "#efc14a", "#56ae70"].forEach((color, index) => {
          context.beginPath();
          context.arc(x + 22 + index * 22, y + frameBar / 2, 6, 0, Math.PI * 2);
          context.fillStyle = color;
          context.fill();
        });
        context.fillStyle = "#ffffff";
        roundedRect(context, x + 105, y + 13, Math.max(80, asset.width - 125), 30, 7);
        context.fill();
        context.fillStyle = "#6b746e";
        context.font = "13px sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(address.slice(0, 90), x + 119, y + 28, Math.max(60, asset.width - 155));
        context.drawImage(asset.image, x, y + frameBar, asset.width, asset.height);
        context.restore();
      } else if (frame === "phone") {
        const x = outerPadding;
        const y = outerPadding;
        const bodyWidth = asset.width + phoneInset * 2;
        const bodyHeight = asset.height + frameBar + phoneInset * 2;
        context.shadowColor = "rgba(0, 0, 0, 0.2)";
        context.shadowBlur = 28;
        context.shadowOffsetY = 12;
        roundedRect(context, x, y, bodyWidth, bodyHeight, 36);
        context.fillStyle = "#1b1c1e";
        context.fill();
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
        context.save();
        roundedRect(context, x + phoneInset, y + phoneInset, asset.width, asset.height + frameBar, 22);
        context.clip();
        context.fillStyle = "#ffffff";
        context.fillRect(x + phoneInset, y + phoneInset, asset.width, frameBar);
        context.drawImage(asset.image, x + phoneInset, y + phoneInset + frameBar, asset.width, asset.height);
        context.restore();
        context.fillStyle = "#1b1c1e";
        roundedRect(context, x + bodyWidth / 2 - 42, y + phoneInset + 12, 84, 6, 3);
        context.fill();
      } else {
        context.drawImage(asset.image, 0, 0);
      }

      const blob = await canvasToBlob(canvas, "image/png");
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      setFeedback("Screenshot mockup is ready to download.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to create the screenshot mockup.");
    }
  }

  function clearAll() {
    clearResult();
    clear();
    setFeedback("");
  }

  return (
    <div className="grid gap-7 pt-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-5">
        <ImageFilePicker id="beautifier-file" onSelect={(file) => { clearResult(); setFeedback(""); void selectFile(file); }} />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[var(--ink)]">Frame</legend>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Screenshot frame">
            {(["browser", "phone", "none"] as const).map((option) => <button key={option} type="button" aria-pressed={frame === option} onClick={() => { setFrame(option); clearResult(); }} className={`min-h-10 rounded-md border text-sm font-semibold capitalize ${frame === option ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}>{option === "none" ? "None" : option}</button>)}
          </div>
        </fieldset>
        {frame === "browser" && <label className="block text-sm font-semibold text-[var(--ink)]">Address bar<input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={120} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]" /></label>}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[var(--ink)]">Background</legend>
          <div className="flex flex-wrap gap-2">
            {backgrounds.map((color) => <button key={color} type="button" aria-label={`Set background ${color}`} aria-pressed={background === color} onClick={() => { setBackground(color); clearResult(); }} className="size-9 rounded-md border border-black/10 outline-offset-2 aria-pressed:outline aria-pressed:outline-2 aria-pressed:outline-[var(--accent-dark)]" style={{ backgroundColor: color }} />)}
            <label className="grid size-9 cursor-pointer place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[10px] font-bold text-[var(--ink)]">Custom<input type="color" value={background} onChange={(event) => { setBackground(event.target.value); clearResult(); }} aria-label="Custom background color" className="sr-only" /></label>
          </div>
        </fieldset>
        {frame !== "none" && <label className="block text-sm font-semibold text-[var(--ink)]">Outer padding: {padding}px<input type="range" min="24" max="120" step="8" value={padding} onChange={(event) => { setPadding(Number(event.target.value)); clearResult(); }} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>}
        {frame === "browser" && <label className="block text-sm font-semibold text-[var(--ink)]">Corner radius: {cornerRadius}px<input type="range" min="0" max="36" value={cornerRadius} onChange={(event) => { setCornerRadius(Number(event.target.value)); clearResult(); }} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>}
        <div className="flex gap-3"><button type="button" onClick={createMockup} disabled={!asset} className="min-h-10 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">Create mockup</button>{asset && <button type="button" onClick={clearAll} aria-label="Clear screenshot" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}</div>
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
      </div>
      <div className="grid min-h-72 place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-8">{resultUrl ? <Image src={resultUrl} alt="Beautified screenshot preview" width={1600} height={1200} unoptimized className="h-auto max-h-[40rem] max-w-full object-contain" /> : asset ? <Image src={asset.previewUrl} alt="Screenshot source preview" width={asset.width} height={asset.height} unoptimized className="h-auto max-h-[40rem] max-w-full object-contain" /> : <p className="text-sm text-[var(--muted)]">Choose a screenshot to preview the frame.</p>}</div>
      {resultUrl && asset && <a href={resultUrl} download={`${getBaseName(asset.file.name)}-mockup.png`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><Download aria-hidden="true" className="size-4" />Download PNG</a>}
    </div>
  );
}