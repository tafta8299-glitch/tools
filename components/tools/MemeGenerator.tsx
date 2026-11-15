"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

function wrapWords(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line || !paragraph) lines.push(line);
  }
  return lines;
}

type MemeShape = "none" | "rounded" | "pill" | "square" | "banner";

const memeShapePresets: Array<{ id: MemeShape; label: string; radius: number }> = [
  { id: "none", label: "None", radius: 0 },
  { id: "rounded", label: "Rounded", radius: 18 },
  { id: "pill", label: "Pill", radius: 999 },
  { id: "square", label: "Square", radius: 6 },
  { id: "banner", label: "Banner", radius: 12 },
];

export function MemeGenerator() {
  const { asset, error, selectFile, clear } = useImageAsset();
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [fontWeight, setFontWeight] = useState(900);
  const [uppercase, setUppercase] = useState(true);
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#111111");
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [shape, setShape] = useState<MemeShape>("rounded");
  const [radius, setRadius] = useState(18);
  const [resultUrl, setResultUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const resultUrlRef = useRef("");

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResultUrl("");
  }

  function applyShapePreset(nextShape: MemeShape) {
    setShape(nextShape);
    const preset = memeShapePresets.find((option) => option.id === nextShape);
    if (preset) setRadius(preset.radius);
  }

  async function generate() {
    if (!asset) return;
    try {
      const scale = Math.min(1, 3000 / Math.max(asset.width, asset.height));
      const width = Math.round(asset.width * scale);
      const height = Math.round(asset.height * scale);
      const canvas = makeCanvas(width, height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      context.drawImage(asset.image, 0, 0, width, height);
      const actualFontSize = Math.max(8, Math.min(fontSize * scale, width / 8));
      context.font = `${fontWeight} ${actualFontSize}px Impact, "Arial Narrow", sans-serif`;
      context.textAlign = "center";
      context.lineJoin = "round";
      context.lineWidth = Math.max(2, actualFontSize * 0.1);

      const drawBackground = (x: number, y: number, w: number, h: number) => {
        if (!backgroundEnabled) return;
        const boxRadius = shape === "none" ? 0 : shape === "pill" ? h / 2 : shape === "square" ? 0 : radius;
        context.beginPath();
        if (typeof context.roundRect === "function") {
          context.roundRect(x, y, w, h, boxRadius);
        } else {
          const r = Math.min(boxRadius, w / 2, h / 2);
          const x1 = x;
          const y1 = y;
          const x2 = x + w;
          const y2 = y + h;
          context.moveTo(x1 + r, y1);
          context.lineTo(x2 - r, y1);
          context.quadraticCurveTo(x2, y1, x2, y1 + r);
          context.lineTo(x2, y2 - r);
          context.quadraticCurveTo(x2, y2, x2 - r, y2);
          context.lineTo(x1 + r, y2);
          context.quadraticCurveTo(x1, y2, x1, y2 - r);
          context.lineTo(x1, y1 + r);
          context.quadraticCurveTo(x1, y1, x1 + r, y1);
        }
        context.fillStyle = backgroundColor;
        context.fill();
      };

      const drawText = (text: string, y: number, top: boolean) => {
        const value = uppercase ? text.toLocaleUpperCase() : text;
        const lines = wrapWords(context, value, width * 0.9);
        const lineHeight = actualFontSize * 1.1;
        lines.forEach((line, index) => {
          const lineY = top ? y + index * lineHeight : y - (lines.length - 1 - index) * lineHeight;
          const textWidth = context.measureText(line).width;
          const padX = Math.max(12, actualFontSize * 0.4);
          const padY = Math.max(8, actualFontSize * 0.25);
          const boxWidth = textWidth + padX * 2;
          const boxHeight = Math.max(actualFontSize + padY * 2, actualFontSize * 1.4);
          const boxX = width / 2 - boxWidth / 2;
          const boxY = Math.min(Math.max(lineY - actualFontSize - padY, 0), height - boxHeight);
          if (backgroundEnabled) drawBackground(boxX, boxY, boxWidth, boxHeight);
          context.strokeStyle = textColor;
          context.fillStyle = textColor;
          context.strokeText(line, width / 2, lineY, width * 0.92);
          context.fillText(line, width / 2, lineY, width * 0.92);
        });
      };

      if (topText.trim()) drawText(topText.trim(), actualFontSize * 1.25, true);
      if (bottomText.trim()) drawText(bottomText.trim(), height - actualFontSize * 0.35, false);

      const blob = await canvasToBlob(canvas, "image/jpeg", 0.94);
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      setFeedback("Meme image is ready to download.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to generate this image.");
    }
  }

  function clearAll() {
    clearResult();
    clear();
    setTopText("");
    setBottomText("");
    setFontWeight(900);
    setTextColor("#ffffff");
    setBackgroundColor("#111111");
    setBackgroundEnabled(false);
    setShape("rounded");
    setRadius(18);
    setFeedback("");
  }

  return (
    <div className="grid gap-7 pt-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <ImageFilePicker id="meme-image-file" onSelect={(file) => { clearResult(); setFeedback(""); void selectFile(file); }} />
        {asset && <p className="text-xs text-[var(--muted)]">{asset.width} × {asset.height} px</p>}
        <label className="block text-sm font-semibold text-[var(--ink)]">Top text<input value={topText} onChange={(event) => setTopText(event.target.value)} maxLength={180} placeholder="Optional top caption" className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal" /></label>
        <label className="block text-sm font-semibold text-[var(--ink)]">Bottom text<input value={bottomText} onChange={(event) => setBottomText(event.target.value)} maxLength={180} placeholder="Optional bottom caption" className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal" /></label>
        <label className="block text-sm font-semibold text-[var(--ink)]">Text size: {fontSize}px<input type="range" min="8" max="88" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>
        <label className="block text-sm font-semibold text-[var(--ink)]">Font weight: {fontWeight}<input type="range" min="400" max="900" step="50" value={fontWeight} onChange={(event) => setFontWeight(Number(event.target.value))} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>

        <div className="grid grid-cols-2 gap-3">
          <label className="inline-flex items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink)]">
            <input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} aria-label="Text color" className="size-7 rounded border-0 bg-transparent p-0" />
            Text color
          </label>
          <label className="inline-flex items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink)]">
            <input type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} aria-label="Text background color" className="size-7 rounded border-0 bg-transparent p-0" />
            BG color
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><input type="checkbox" checked={backgroundEnabled} onChange={(event) => setBackgroundEnabled(event.target.checked)} className="size-4 accent-[var(--accent-dark)]" />Add text background</label>

        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--ink)]">Background shape</p>
          <div className="flex flex-wrap gap-2">
            {memeShapePresets.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={`Use ${option.label} text background shape`}
                aria-pressed={shape === option.id}
                onClick={() => applyShapePreset(option.id)}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium transition-colors ${shape === option.id ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}
              >
                <span className="grid place-items-center" style={{ width: 18, height: 12 }}>
                  <span
                    style={{
                      width: option.id === "pill" ? 18 : option.id === "square" ? 14 : option.id === "banner" ? 18 : 16,
                      height: 10,
                      borderRadius: option.id === "pill" ? 999 : option.id === "square" ? 2 : option.id === "banner" ? 4 : 8,
                      backgroundColor: shape === option.id ? "currentColor" : backgroundColor,
                      border: shape === option.id ? "1px solid currentColor" : "1px solid transparent",
                    }}
                  />
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {backgroundEnabled && (
          <label className="block text-sm font-semibold text-[var(--ink)]">Background radius: {radius}px<input type="range" min="0" max="40" value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" /></label>
        )}

        <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} className="size-4 accent-[var(--accent-dark)]" />Uppercase captions</label>
        <div className="flex gap-3"><button type="button" onClick={generate} disabled={!asset} className="min-h-10 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45">Create meme</button>{asset && <button type="button" onClick={clearAll} aria-label="Clear image and captions" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}</div>
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
      </div>
      <div className="space-y-3"><div className="grid min-h-64 place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">{resultUrl ? <Image src={resultUrl} alt="Generated meme preview" width={1200} height={1200} unoptimized className="max-h-[36rem] h-auto max-w-full object-contain" /> : asset ? <Image src={asset.previewUrl} alt="Meme source image" width={asset.width} height={asset.height} unoptimized className="max-h-[36rem] h-auto max-w-full object-contain" /> : <p className="text-sm text-[var(--muted)]">Your meme preview will appear here.</p>}</div>{resultUrl && asset && <a href={resultUrl} download={`${getBaseName(asset.file.name)}-meme.jpg`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><Download aria-hidden="true" className="size-4" />Download JPEG</a>}</div>
    </div>
  );
}