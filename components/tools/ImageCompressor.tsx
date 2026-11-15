"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Download, ImagePlus, X } from "lucide-react";

const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

type OutputFormat = "original" | "webp" | "jpeg";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExtension(mimeType: string): string {
  return mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1] || "img";
}

export function ImageCompressor() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [maxSizeMB, setMaxSizeMB] = useState(0.5);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [progress, setProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");

  useEffect(() => () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResultUrl("");
    setResultFile(null);
    setProgress(0);
  }

  function clearImages() {
    if (isCompressing) return;

    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    setSourceUrl("");
    setSourceFile(null);
    clearResult();
    setFeedback("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function selectFile(file?: File) {
    setFeedback("");
    clearResult();

    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    setSourceUrl("");
    setSourceFile(null);

    if (!file) return;
    if (!supportedTypes.includes(file.type)) {
      setFeedback("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setFeedback("Choose an image smaller than 20 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    sourceUrlRef.current = previewUrl;
    setSourceFile(file);
    setSourceUrl(previewUrl);
  }

  async function compressImage() {
    if (!sourceFile) return;

    setIsCompressing(true);
    setProgress(0);
    setFeedback("");

    const fileType = outputFormat === "original"
      ? sourceFile.type
      : `image/${outputFormat}`;

    try {
      const compressedFile = await imageCompression(sourceFile, {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: false,
        preserveExif: false,
        fileType,
        initialQuality: 0.82,
        onProgress: (value) => setProgress(Math.round(value)),
      });

      clearResult();
      const previewUrl = URL.createObjectURL(compressedFile);
      resultUrlRef.current = previewUrl;
      setResultFile(compressedFile);
      setResultUrl(previewUrl);
      setProgress(100);
      setFeedback("Compression complete. Your image is ready to download.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not compress this image. Try a different file or format.");
    } finally {
      setIsCompressing(false);
    }
  }

  const savedPercentage = sourceFile && resultFile && sourceFile.size > 0
    ? Math.max(0, Math.round((1 - resultFile.size / sourceFile.size) * 100))
    : 0;
  const downloadName = sourceFile && resultFile
    ? `${sourceFile.name.replace(/\.[^.]+$/u, "")}-compressed.${getExtension(resultFile.type)}`
    : "compressed-image";

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
              <label htmlFor="image-file" className="text-sm font-semibold text-[var(--ink)]">Image file</label>
              {sourceFile && (
                <button type="button" onClick={clearImages} disabled={isCompressing} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45">
                  <X aria-hidden="true" className="size-3.5" />
                  Clear images
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="image-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={isCompressing}
              onChange={(event) => selectFile(event.target.files?.[0])}
              className="block min-h-12 w-full cursor-pointer rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--muted)] file:mr-3 file:h-12 file:border-0 file:bg-[var(--paper)] file:px-3 file:text-sm file:font-semibold file:text-[var(--ink)]"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">PNG, JPEG, or WebP. Maximum 20 MB.</p>
          </div>

          <div>
            <label htmlFor="image-target-size" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Target file size</label>
            <select id="image-target-size" value={maxSizeMB} onChange={(event) => setMaxSizeMB(Number(event.target.value))} disabled={isCompressing} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
              <option value={0.25}>250 KB</option>
              <option value={0.5}>500 KB</option>
              <option value={1}>1 MB</option>
              <option value={2}>2 MB</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="image-max-dimension" className="mb-2 block text-xs font-semibold text-[var(--muted)]">Max dimension</label>
              <select id="image-max-dimension" value={maxWidthOrHeight} onChange={(event) => setMaxWidthOrHeight(Number(event.target.value))} disabled={isCompressing} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
                <option value={1280}>1280 px</option>
                <option value={1920}>1920 px</option>
                <option value={2560}>2560 px</option>
                <option value={3840}>3840 px</option>
              </select>
            </div>
            <div>
              <label htmlFor="image-format" className="mb-2 block text-xs font-semibold text-[var(--muted)]">Output format</label>
              <select id="image-format" value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as OutputFormat)} disabled={isCompressing} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
                <option value="original">Keep original</option>
                <option value="webp">WebP</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>
          </div>

          <button type="button" onClick={compressImage} disabled={!sourceFile || isCompressing} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45">
            <ImagePlus aria-hidden="true" className="size-4" />
            {isCompressing ? `Compressing ${progress}%` : "Compress image"}
          </button>

          {isCompressing && (
            <progress aria-label="Compression progress" value={progress} max={100} className="h-2 w-full accent-[var(--accent-dark)]" />
          )}
          <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{feedback}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section aria-label="Original image" className="min-w-0">
            <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">Original</h3>
            <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
              {sourceUrl ? <Image src={sourceUrl} alt="Original image preview" width={640} height={480} unoptimized className="h-full w-full object-contain" /> : <p className="px-4 text-center text-sm text-[var(--muted)]">Choose an image to preview it.</p>}
            </div>
            <p className="mt-2 break-words text-xs text-[var(--muted)]">{sourceFile ? `${formatBytes(sourceFile.size)} · ${sourceFile.type.replace("image/", "").toUpperCase()}` : ""}</p>
          </section>

          <section aria-label="Compressed image" className="min-w-0">
            <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">Compressed</h3>
            <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
              {resultUrl ? <Image src={resultUrl} alt="Compressed image preview" width={640} height={480} unoptimized className="h-full w-full object-contain" /> : <p className="px-4 text-center text-sm text-[var(--muted)]">Compressed preview will appear here.</p>}
            </div>
            <div className="mt-2 flex min-h-5 flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
              <span>{resultFile ? `${formatBytes(resultFile.size)} · ${resultFile.type.replace("image/", "").toUpperCase()}` : ""}</span>
              {resultFile && <span>{savedPercentage > 0 ? `${savedPercentage}% smaller` : "No size reduction"}</span>}
            </div>
            {resultUrl && (
              <a href={resultUrl} download={downloadName} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]">
                <Download aria-hidden="true" className="size-4" />
                Download image
              </a>
            )}
          </section>
        </div>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">Images are processed locally in your browser and are not uploaded.</p>
    </div>
  );
}