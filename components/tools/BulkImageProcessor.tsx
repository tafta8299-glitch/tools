"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import { Download, Images, X } from "lucide-react";
import {
  canvasToBlob,
  drawContain,
  drawCover,
  formatBytes,
  getImageExtension,
  makeCanvas,
} from "@/components/tools/image/image-utils";

type ImageOperation =
  | "compress"
  | "resize"
  | "convert"
  | "upscale"
  | "crop"
  | "background"
  | "social"
  | "meme"
  | "frame"
  | "clean"
  | "metadata"
  | "favicon";
type ImageFormat = "image/png" | "image/jpeg" | "image/webp";
type CropRatio = "1:1" | "4:3" | "16:9" | "9:16";
type SocialPreset = "square" | "portrait" | "story" | "landscape";
type ProcessedImage = { blob: Blob; extension: string; suffix?: string };

const maximumFileSize = 20 * 1024 * 1024;
const operationLabels: Record<ImageOperation, string> = {
  compress: "Compress images",
  resize: "Resize images",
  convert: "Convert image format",
  upscale: "Upscale images",
  crop: "Center-crop images",
  background: "Remove a solid background color",
  social: "Resize for social media",
  meme: "Add captions to images",
  frame: "Frame screenshots in browser style",
  clean: "Remove image metadata",
  metadata: "Create image metadata reports",
  favicon: "Create favicon sets",
};

const socialPresets: Record<SocialPreset, { label: string; width: number; height: number }> = {
  square: { label: "Square post", width: 1080, height: 1080 },
  portrait: { label: "Portrait post", width: 1080, height: 1350 },
  story: { label: "Story", width: 1080, height: 1920 },
  landscape: { label: "Landscape post", width: 1280, height: 720 },
};

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/u, "").replace(/[^a-zA-Z0-9_-]+/gu, "-") || "image";
}

function makeIco(png: Uint8Array): Blob {
  const ico = new Uint8Array(22 + png.length);
  const view = new DataView(ico.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  ico[6] = 32;
  ico[7] = 32;
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, png.length, true);
  view.setUint32(18, 22, true);
  ico.set(png, 22);
  return new Blob([ico], { type: "image/x-icon" });
}

async function processImage(
  file: File,
  operation: ImageOperation,
  settings: {
    maxSizeMB: number;
    maxDimension: number;
    percent: number;
    scale: number;
    format: ImageFormat;
    quality: number;
    cropRatio: CropRatio;
    backgroundColor: string;
    tolerance: number;
    socialPreset: SocialPreset;
    fit: "cover" | "contain";
    topText: string;
    bottomText: string;
    address: string;
  },
): Promise<ProcessedImage[]> {
  if (operation === "metadata") {
    const { default: exifr } = await import("exifr");
    const metadata = await exifr.parse(file, { gps: true, xmp: true, iptc: true });
    const report = JSON.stringify(metadata ?? {}, (_key, value: unknown) =>
      typeof value === "bigint" ? value.toString() : value,
      2,
    );
    return [{ blob: new Blob([report], { type: "application/json" }), extension: "json" }];
  }

  if (operation === "compress") {
    const fileType = settings.format === "image/jpeg" || settings.format === "image/webp"
      ? settings.format
      : file.type;
    const compressed = await imageCompression(file, {
      maxSizeMB: settings.maxSizeMB,
      maxWidthOrHeight: settings.maxDimension,
      useWebWorker: false,
      preserveExif: false,
      fileType,
      initialQuality: settings.quality / 100,
    });
    return [{ blob: compressed, extension: getImageExtension(compressed.type) }];
  }

  const bitmap = await createImageBitmap(file);
  if (operation === "favicon") {
    try {
      const zip = new JSZip();
      const iconSizes = [16, 32, 48, 180, 192, 512];
      const manifestIcons: { src: string; sizes: string; type: string }[] = [];
      let ico: Blob | undefined;
      for (const size of iconSizes) {
        const canvas = makeCanvas(size, size);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image rendering is unavailable in this browser.");
        drawCover(context, bitmap, bitmap.width, bitmap.height, size, size);
        const blob = await canvasToBlob(canvas, "image/png");
        zip.file(`favicon-${size}x${size}.png`, blob);
        manifestIcons.push({ src: `favicon-${size}x${size}.png`, sizes: `${size}x${size}`, type: "image/png" });
        if (size === 32) ico = makeIco(new Uint8Array(await blob.arrayBuffer()));
      }
      if (ico) zip.file("favicon.ico", await ico.arrayBuffer());
      zip.file("site.webmanifest", JSON.stringify({ name: "Website", short_name: "Website", icons: manifestIcons, display: "standalone" }, null, 2));
      return [{ blob: await zip.generateAsync({ type: "blob" }), extension: "zip", suffix: "favicon-set" }];
    } finally {
      bitmap.close();
    }
  }

  let width = bitmap.width;
  let height = bitmap.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = bitmap.width;
  let sourceHeight = bitmap.height;

  if (operation === "resize") {
    width = Math.max(1, Math.round(bitmap.width * settings.percent / 100));
    height = Math.max(1, Math.round(bitmap.height * settings.percent / 100));
  } else if (operation === "upscale") {
    width *= settings.scale;
    height *= settings.scale;
  } else if (operation === "crop") {
    const [ratioWidth, ratioHeight] = settings.cropRatio.split(":").map(Number);
    const targetRatio = ratioWidth / ratioHeight;
    const sourceRatio = bitmap.width / bitmap.height;
    if (sourceRatio > targetRatio) {
      sourceWidth = bitmap.height * targetRatio;
      sourceX = (bitmap.width - sourceWidth) / 2;
    } else {
      sourceHeight = bitmap.width / targetRatio;
      sourceY = (bitmap.height - sourceHeight) / 2;
    }
    width = Math.round(sourceWidth);
    height = Math.round(sourceHeight);
    sourceWidth = width;
    sourceHeight = height;
  } else if (operation === "social") {
    width = socialPresets[settings.socialPreset].width;
    height = socialPresets[settings.socialPreset].height;
  } else if (operation === "frame") {
    width = bitmap.width + 96;
    height = bitmap.height + 160;
  } else if (operation === "meme") {
    const shrink = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
    width = Math.max(1, Math.round(bitmap.width * shrink));
    height = Math.max(1, Math.round(bitmap.height * shrink));
  }

  if (width > 10000 || height > 10000 || width * height > 40_000_000) {
    bitmap.close();
    throw new Error("This output exceeds the 40-megapixel limit. Choose a smaller size.");
  }

  const canvas = makeCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Image rendering is unavailable in this browser.");
  }
  const outputFormat = operation === "background"
    ? "image/png"
    : operation === "social" || operation === "meme"
      ? "image/jpeg"
      : operation === "frame"
        ? "image/png"
        : settings.format;
  if (operation === "social" || operation === "frame") {
    context.fillStyle = settings.backgroundColor;
    context.fillRect(0, 0, width, height);
  } else if (outputFormat === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (operation === "social") {
    const draw = settings.fit === "cover" ? drawCover : drawContain;
    draw(context, bitmap, bitmap.width, bitmap.height, width, height);
  } else if (operation === "frame") {
    const frameX = 48;
    const frameY = 48;
    const barHeight = 64;
    context.fillStyle = "#ffffff";
    context.fillRect(frameX, frameY, bitmap.width, bitmap.height + barHeight);
    context.fillStyle = "#f3f4f3";
    context.fillRect(frameX, frameY, bitmap.width, barHeight);
    ["#f16b62", "#efc14a", "#56ae70"].forEach((color, index) => {
      context.beginPath();
      context.arc(frameX + 22 + index * 22, frameY + barHeight / 2, 6, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    });
    context.fillStyle = "#ffffff";
    context.fillRect(frameX + 96, frameY + 16, Math.max(80, bitmap.width - 112), 32);
    context.fillStyle = "#59635d";
    context.font = "14px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(settings.address.slice(0, 80), frameX + 108, frameY + 32, Math.max(60, bitmap.width - 136));
    context.drawImage(bitmap, frameX, frameY + barHeight);
  } else {
    context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  }

  if (operation === "background") {
    const pixels = context.getImageData(0, 0, width, height);
    const hex = settings.backgroundColor.replace("#", "");
    const target = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const distance = Math.max(
        Math.abs(pixels.data[offset] - target[0]),
        Math.abs(pixels.data[offset + 1] - target[1]),
        Math.abs(pixels.data[offset + 2] - target[2]),
      );
      if (distance <= settings.tolerance) pixels.data[offset + 3] = 0;
    }
    context.putImageData(pixels, 0, 0);
  }

  if (operation === "meme") {
    context.font = `900 ${Math.max(18, Math.round(width / 12))}px Impact, sans-serif`;
    context.textAlign = "center";
    context.lineJoin = "round";
    context.lineWidth = Math.max(2, width / 160);
    context.strokeStyle = "#111111";
    context.fillStyle = "#ffffff";
    if (settings.topText.trim()) {
      context.strokeText(settings.topText.trim().toLocaleUpperCase(), width / 2, height * 0.12, width * 0.9);
      context.fillText(settings.topText.trim().toLocaleUpperCase(), width / 2, height * 0.12, width * 0.9);
    }
    if (settings.bottomText.trim()) {
      context.strokeText(settings.bottomText.trim().toLocaleUpperCase(), width / 2, height * 0.92, width * 0.9);
      context.fillText(settings.bottomText.trim().toLocaleUpperCase(), width / 2, height * 0.92, width * 0.9);
    }
  }
  bitmap.close();

  const blob = await canvasToBlob(
    canvas,
    outputFormat,
    outputFormat === "image/png" ? undefined : settings.quality / 100,
  );
  return [{ blob, extension: getImageExtension(blob.type) }];
}

export function BulkImageProcessor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputUrlRef = useRef("");
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState<ImageOperation>("compress");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(88);
  const [maxSizeMB, setMaxSizeMB] = useState(0.5);
  const [maxDimension, setMaxDimension] = useState(1920);
  const [percent, setPercent] = useState(50);
  const [scale, setScale] = useState(2);
  const [cropRatio, setCropRatio] = useState<CropRatio>("1:1");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [tolerance, setTolerance] = useState(40);
  const [socialPreset, setSocialPreset] = useState<SocialPreset>("square");
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [address, setAddress] = useState("your-project.example");
  const [output, setOutput] = useState<{ url: string; blob: Blob; count: number } | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => () => {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
  }, []);

  function clearOutput() {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    outputUrlRef.current = "";
    setOutput(null);
  }

  function chooseFiles(selectedFiles: FileList | null) {
    clearOutput();
    setFeedback("");
    setIsError(false);
    setProgress(0);
    setFiles(selectedFiles ? Array.from(selectedFiles).slice(0, 50) : []);
    if (selectedFiles && selectedFiles.length > 50) {
      setFeedback("Only the first 50 files were added.");
    }
  }

  function clearAll() {
    clearOutput();
    setFiles([]);
    setProgress(0);
    setFeedback("");
    setIsError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function processFiles() {
    if (!files.length || isWorking) return;
    setIsWorking(true);
    setProgress(0);
    setFeedback("");
    setIsError(false);
    clearOutput();

    const archive = new JSZip();
    const failures: string[] = [];
    let processed = 0;
    const settings = {
      maxSizeMB,
      maxDimension,
      percent,
      scale,
      format,
      quality,
      cropRatio,
      backgroundColor,
      tolerance,
      socialPreset,
      fit,
      topText,
      bottomText,
      address,
    };

    for (const [index, file] of files.entries()) {
      try {
        if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Use PNG, JPEG, or WebP files.");
        }
        if (file.size > maximumFileSize) {
          throw new Error("File exceeds 20 MB.");
        }
        const results = await processImage(file, operation, settings);
        const sequence = String(index + 1).padStart(2, "0");
        const folder = archive.folder(`${sequence}-${baseName(file.name)}`);
        if (!folder) throw new Error("Could not add results to the ZIP archive.");
        for (const result of results) {
          if (operation === "favicon") {
            const faviconArchive = await JSZip.loadAsync(result.blob);
            for (const iconFile of Object.values(faviconArchive.files)) {
              if (!iconFile.dir) folder.file(iconFile.name, await iconFile.async("blob"));
            }
          } else {
            folder.file(`${baseName(file.name)}-${result.suffix ?? operation}.${result.extension}`, result.blob);
          }
        }
        processed += 1;
      } catch (caught) {
        failures.push(`${file.name}: ${caught instanceof Error ? caught.message : "Could not process this file."}`);
      }
      setProgress(Math.round(((index + 1) / files.length) * 100));
    }

    try {
      if (processed === 0) {
        throw new Error(failures[0] ?? "No files could be processed.");
      }
      const blob = await archive.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutput({ url, blob, count: processed });
      setFeedback(
        failures.length
          ? `${processed} ${processed === 1 ? "file" : "files"} processed. ${failures.length} could not be processed: ${failures.slice(0, 3).join(" ")}`
          : `${processed} ${processed === 1 ? "file" : "files"} processed. Your ZIP is ready.`,
      );
      setIsError(failures.length > 0);
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "No files could be processed.");
      setIsError(true);
    } finally {
      setIsWorking(false);
    }
  }

  const supportsFormatChoice = ["resize", "convert", "upscale", "crop", "clean"].includes(operation);
  const needsQuality = supportsFormatChoice && format !== "image/png";

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <div>
            <label htmlFor="bulk-image-files" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
              Choose images
            </label>
            <input
              ref={fileInputRef}
              id="bulk-image-files"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              disabled={isWorking}
              onChange={(event) => chooseFiles(event.target.files)}
              className="block min-h-12 w-full cursor-pointer rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--ink)] file:mr-3 file:min-h-12 file:border-0 file:bg-[var(--paper)] file:px-3 file:text-sm file:font-semibold file:text-[var(--ink)] disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">Up to 50 PNG, JPEG, or WebP images · 20 MB each</p>
          </div>

          <div>
            <label htmlFor="bulk-image-operation" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
              Operation
            </label>
            <select
              id="bulk-image-operation"
              value={operation}
              disabled={isWorking}
              onChange={(event) => {
                setOperation(event.target.value as ImageOperation);
                clearOutput();
                setFeedback("");
              }}
              className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] disabled:opacity-50"
            >
              {Object.entries(operationLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {operation === "compress" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[var(--muted)]">
                Target size
                <select value={maxSizeMB} disabled={isWorking} onChange={(event) => setMaxSizeMB(Number(event.target.value))} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-normal text-[var(--ink)]">
                  <option value={0.25}>250 KB</option><option value={0.5}>500 KB</option><option value={1}>1 MB</option><option value={2}>2 MB</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--muted)]">
                Max dimension
                <select value={maxDimension} disabled={isWorking} onChange={(event) => setMaxDimension(Number(event.target.value))} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-normal text-[var(--ink)]">
                  <option value={1280}>1280 px</option><option value={1920}>1920 px</option><option value={2560}>2560 px</option><option value={3840}>3840 px</option>
                </select>
              </label>
            </div>
          ) : null}

          {operation === "resize" ? (
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Resize: {percent}%
              <input type="range" min="10" max="400" step="10" value={percent} disabled={isWorking} onChange={(event) => setPercent(Number(event.target.value))} className="mt-3 h-2 w-full accent-[var(--accent-dark)]" />
            </label>
          ) : null}

          {operation === "upscale" ? (
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Scale factor
              <select value={scale} disabled={isWorking} onChange={(event) => setScale(Number(event.target.value))} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]">
                <option value={2}>2×</option><option value={3}>3×</option><option value={4}>4×</option>
              </select>
            </label>
          ) : null}

          {operation === "crop" ? (
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Center crop ratio
              <select value={cropRatio} disabled={isWorking} onChange={(event) => setCropRatio(event.target.value as CropRatio)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]">
                <option value="1:1">Square · 1:1</option><option value="4:3">Photo · 4:3</option><option value="16:9">Widescreen · 16:9</option><option value="9:16">Portrait · 9:16</option>
              </select>
            </label>
          ) : null}

          {operation === "background" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[var(--muted)]">Sample background color<input type="color" value={backgroundColor} disabled={isWorking} onChange={(event) => setBackgroundColor(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] p-1" /></label>
              <label className="text-xs font-semibold text-[var(--muted)]">Color tolerance: {tolerance}<input type="range" min="0" max="180" value={tolerance} disabled={isWorking} onChange={(event) => setTolerance(Number(event.target.value))} className="mt-4 h-2 w-full accent-[var(--accent-dark)]" /></label>
            </div>
          ) : null}

          {operation === "social" ? (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--ink)]">Output size<select value={socialPreset} disabled={isWorking} onChange={(event) => setSocialPreset(event.target.value as SocialPreset)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal"><option value="square">Square · 1080 × 1080</option><option value="portrait">Portrait · 1080 × 1350</option><option value="story">Story · 1080 × 1920</option><option value="landscape">Landscape · 1280 × 720</option></select></label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Image fit">
                <button type="button" aria-pressed={fit === "cover"} disabled={isWorking} onClick={() => setFit("cover")} className={`min-h-10 rounded-md border text-sm font-semibold ${fit === "cover" ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] text-[var(--muted)]"}`}>Fill and crop</button>
                <button type="button" aria-pressed={fit === "contain"} disabled={isWorking} onClick={() => setFit("contain")} className={`min-h-10 rounded-md border text-sm font-semibold ${fit === "contain" ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] text-[var(--muted)]"}`}>Fit with background</button>
              </div>
              {fit === "contain" ? <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><input type="color" value={backgroundColor} disabled={isWorking} onChange={(event) => setBackgroundColor(event.target.value)} className="size-9 rounded border border-[var(--line)] p-1" />Background color</label> : null}
            </div>
          ) : null}

          {operation === "meme" ? (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--ink)]">Top caption<input value={topText} maxLength={180} disabled={isWorking} onChange={(event) => setTopText(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal" /></label>
              <label className="block text-sm font-semibold text-[var(--ink)]">Bottom caption<input value={bottomText} maxLength={180} disabled={isWorking} onChange={(event) => setBottomText(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal" /></label>
            </div>
          ) : null}

          {operation === "frame" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[var(--muted)]">Address bar<input value={address} maxLength={80} disabled={isWorking} onChange={(event) => setAddress(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-normal text-[var(--ink)]" /></label>
              <label className="text-xs font-semibold text-[var(--muted)]">Backdrop<input type="color" value={backgroundColor} disabled={isWorking} onChange={(event) => setBackgroundColor(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] p-1" /></label>
            </div>
          ) : null}

          {supportsFormatChoice ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[var(--muted)]">
                Output format
                <select value={format} disabled={isWorking} onChange={(event) => setFormat(event.target.value as ImageFormat)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-normal text-[var(--ink)]">
                  <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
                </select>
              </label>
              {needsQuality ? (
                <label className="text-xs font-semibold text-[var(--muted)]">
                  Quality: {quality}%
                  <input type="range" min="40" max="100" value={quality} disabled={isWorking} onChange={(event) => setQuality(Number(event.target.value))} className="mt-4 h-2 w-full accent-[var(--accent-dark)]" />
                </label>
              ) : null}
            </div>
          ) : operation === "compress" ? (
            <label className="block text-xs font-semibold text-[var(--muted)]">
              Output format
              <select value={format} disabled={isWorking} onChange={(event) => setFormat(event.target.value as ImageFormat)} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]">
                <option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">Keep PNG files as PNG</option>
              </select>
            </label>
          ) : null}

          <div className="flex gap-3">
            <button type="button" onClick={processFiles} disabled={!files.length || isWorking} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45">
              <Images aria-hidden="true" className="size-4" />
              {isWorking ? `Processing ${progress}%` : "Process images"}
            </button>
            {files.length > 0 ? (
              <button type="button" onClick={clearAll} disabled={isWorking} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--paper)] disabled:opacity-50">
                <X aria-hidden="true" className="size-4" />Clear
              </button>
            ) : null}
          </div>

          {isWorking ? <progress aria-label="Image batch progress" value={progress} max={100} className="h-2 w-full accent-[var(--accent-dark)]" /> : null}
          <p aria-live="polite" className={`min-h-5 text-xs ${isError ? "text-red-800" : "text-[var(--muted)]"}`}>{feedback}</p>
        </div>

        <section aria-labelledby="bulk-image-queue-heading" className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <h3 id="bulk-image-queue-heading" className="text-sm font-semibold text-[var(--ink)]">Batch queue</h3>
            <span className="text-xs text-[var(--muted)]">{files.length} {files.length === 1 ? "file" : "files"}</span>
          </div>
          {files.length ? (
            <ul className="divide-y divide-[var(--line)]">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-3 py-3 text-xs">
                  <span className="min-w-0 truncate text-[var(--ink)]">{index + 1}. {file.name}</span>
                  <span className="shrink-0 text-[var(--muted)]">{formatBytes(file.size)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--muted)]">Selected images will appear here.</p>
          )}
          {output ? (
            <a href={output.url} download="trovflex-images.zip" className="mt-5 inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-md bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]">
              <span className="inline-flex items-center gap-2"><Download aria-hidden="true" className="size-4" />Download ZIP · {output.count} images</span>
              <span className="text-xs font-medium text-white/90">{formatBytes(output.blob.size)}</span>
            </a>
          ) : null}
        </section>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">Images are processed on your device. Upscaling enlarges the pixels and does not restore detail missing from the original.</p>
    </div>
  );
}