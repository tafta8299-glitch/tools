"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import exifr from "exifr";
import { Download, ScanSearch, X } from "lucide-react";
import { ImageFilePicker } from "@/components/tools/image/ImageFilePicker";
import { useImageAsset } from "@/components/tools/image/useImageAsset";
import { canvasToBlob, formatBytes, getBaseName, makeCanvas } from "@/components/tools/image/image-utils";

type MetadataEntry = { label: string; value: string };

function printable(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (ArrayBuffer.isView(value)) return `[${Array.from(value as Uint8Array).slice(0, 16).join(", ")}${(value as Uint8Array).length > 16 ? ", …" : ""}]`;
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ImageMetadataViewer() {
  const { asset, error, selectFile, clear } = useImageAsset();
  const [metadata, setMetadata] = useState<MetadataEntry[] | null>(null);
  const [output, setOutput] = useState<{ blob: Blob; url: string; extension: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isReading, setIsReading] = useState(false);
  const outputUrlRef = useRef("");

  function clearOutput() {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    outputUrlRef.current = "";
    setOutput(null);
  }

  function chooseFile(file?: File) {
    clearOutput();
    setMetadata(null);
    setFeedback("");
    void selectFile(file);
  }

  async function readMetadata() {
    if (!asset) return;
    setIsReading(true);
    setFeedback("");
    try {
      const raw = await exifr.parse(asset.file, { gps: true, xmp: true, iptc: true });
      const entries = raw && typeof raw === "object"
        ? Object.entries(raw as Record<string, unknown>)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => ({ label: key, value: printable(value) }))
            .sort((left, right) => left.label.localeCompare(right.label))
        : [];
      setMetadata(entries);
      setFeedback(entries.length ? `${entries.length} hidden details found.` : "No hidden details were found in this image.");
    } catch {
      setMetadata([]);
      setFeedback("Metadata could not be read from this image.");
    } finally {
      setIsReading(false);
    }
  }

  async function removeMetadata() {
    if (!asset) return;
    try {
      const format = ["image/jpeg", "image/png", "image/webp"].includes(asset.file.type)
        ? asset.file.type
        : "image/png";
      const canvas = makeCanvas(asset.width, asset.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas export is unavailable.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(asset.image, 0, 0);
      const blob = await canvasToBlob(canvas, format, 0.94);
      clearOutput();
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      const extension = format === "image/jpeg" ? "jpg" : format.split("/")[1];
      setOutput({ blob, url, extension });
      setFeedback("A metadata-free image copy is ready.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to create a clean image copy.");
    }
  }

  function clearAll() {
    clearOutput();
    clear();
    setMetadata(null);
    setFeedback("");
  }

  return (
    <div className="grid gap-7 pt-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-5">
        <ImageFilePicker id="metadata-image-file" onSelect={chooseFile} />
        {asset && <p className="text-xs text-[var(--muted)]">{asset.width} × {asset.height} px · {formatBytes(asset.file.size)}</p>}
        <div className="rounded-md border border-[var(--line)] bg-[var(--paper)] p-4 text-xs leading-5 text-[var(--muted)]">Photos can contain location and device details. Review the metadata before sharing an image.</div>
        <div className="flex gap-3">
          <button type="button" onClick={readMetadata} disabled={!asset || isReading} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:opacity-45"><ScanSearch aria-hidden="true" className="size-4" />{isReading ? "Reading..." : "Read metadata"}</button>
          {asset && <button type="button" onClick={removeMetadata} className="min-h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] hover:border-[var(--accent-dark)]">Remove metadata</button>}
          {asset && <button type="button" onClick={clearAll} aria-label="Clear image and metadata" className="grid size-10 shrink-0 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]"><X aria-hidden="true" className="size-4" /></button>}
        </div>
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--muted)]">{error || feedback}</p>
        {output && asset && <a href={output.url} download={`${getBaseName(asset.file.name)}-metadata-removed.${output.extension}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><Download aria-hidden="true" className="size-4" />Download clean image · {formatBytes(output.blob.size)}</a>}
        <p className="text-xs leading-5 text-[var(--muted)]">Removing metadata re-encodes the image; JPEG output may differ slightly from the original.</p>
      </div>
      <div className="space-y-4">
        {asset && <div className="grid aspect-video place-items-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]"><Image src={asset.previewUrl} alt="Image metadata source preview" width={asset.width} height={asset.height} unoptimized className="h-full w-full object-contain" /></div>}
        {metadata && (
          <section aria-label="Image metadata" className="max-h-[28rem] overflow-auto rounded-md border border-[var(--line)] bg-[var(--surface)]">
            <dl className="divide-y divide-[var(--line)] px-4">
              {metadata.length ? metadata.map(({ label, value }) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[minmax(9rem,0.4fr)_minmax(0,1fr)]"><dt className="break-words text-xs font-semibold text-[var(--muted)]">{label}</dt><dd className="break-all font-mono text-xs leading-5 text-[var(--ink)]">{value}</dd></div>) : <p className="py-4 text-sm text-[var(--muted)]">No metadata fields to display.</p>}
            </dl>
          </section>
        )}
        {!asset && <div className="grid min-h-56 place-items-center rounded-md border border-dashed border-[var(--line)] bg-[var(--paper)] px-6 text-center text-sm text-[var(--muted)]">Choose an image to inspect its metadata.</div>}
      </div>
    </div>
  );
}