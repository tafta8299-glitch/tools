"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { Download, FilePlus2, X } from "lucide-react";
import { PDFDict, PDFDocument, PDFName, degrees } from "pdf-lib";
import { formatBytes } from "@/components/tools/image/image-utils";

type PdfToolSlug =
  | "pdf-merger"
  | "pdf-splitter"
  | "pdf-compressor"
  | "pdf-to-images"
  | "images-to-pdf"
  | "pdf-page-rotator"
  | "pdf-metadata-remover"
  | "text-to-pdf"
  | "docx-to-pdf"
  | "pdf-to-text";

type PdfToolProps = { toolSlug: string };
type OutputFile = { blob: Blob; name: string; label: string; url: string };

const imageAccept = "image/png,image/jpeg,image/webp";
const docxAccept = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const pdfAccept = "application/pdf,.pdf";

function parsePages(selection: string, pageCount: number): number[] {
  const pages = new Set<number>();
  for (const part of selection.split(",")) {
    const range = part.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/u);
    if (!range) throw new Error("Enter pages like 1, 3-5, 8.");
    const start = Number(range[1]);
    const end = Number(range[2] ?? range[1]);
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Page numbers must be between 1 and ${pageCount}.`);
    }
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  }
  if (!pages.size) throw new Error("Enter at least one page number.");
  return [...pages].sort((left, right) => left - right);
}

function makePdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

function pdfBaseName(name: string): string {
  return name.replace(/\.pdf$/iu, "") || "document";
}

export function PdfTool({ toolSlug }: PdfToolProps) {
  const slug = toolSlug as PdfToolSlug;
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("");
  const [rotation, setRotation] = useState(90);
  const [imageFormat, setImageFormat] = useState<"png" | "jpg">("jpg");
  const [text, setText] = useState("");
  const [output, setOutput] = useState<OutputFile | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isError, setIsError] = useState(false);
  const outputUrl = useRef("");

  const isImageInput = slug === "images-to-pdf";
  const isDocxInput = slug === "docx-to-pdf";
  const isTextInput = slug === "text-to-pdf";
  const isMultiFile = slug === "pdf-merger" || isImageInput;
  const needsPageSelection = slug === "pdf-splitter" || slug === "pdf-page-rotator";

  function clearOutput() {
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    outputUrl.current = "";
    setOutput(null);
  }

  function chooseFiles(nextFiles: FileList | null) {
    clearOutput();
    setFeedback("");
    setIsError(false);
    setFiles(nextFiles ? Array.from(nextFiles) : []);
  }

  function addOutput(blob: Blob, name: string, label: string) {
    clearOutput();
    const url = URL.createObjectURL(blob);
    outputUrl.current = url;
    setOutput({ blob, name, label, url });
    setFeedback(`${label} is ready to download.`);
    setIsError(false);
  }

  async function run() {
    setFeedback("");
    setIsError(false);
    setIsWorking(true);
    try {
      if (slug === "text-to-pdf") {
        if (!text.trim()) throw new Error("Enter some text to create a PDF.");
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ format: "a4", unit: "mm" });
        const margin = 18;
        const lineHeight = 6;
        const lines = pdf.splitTextToSize(text, 210 - margin * 2) as string[];
        let y = margin;
        for (const line of lines) {
          if (y > 297 - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += lineHeight;
        }
        addOutput(pdf.output("blob"), "text-document.pdf", "PDF");
        return;
      }

      if (!files.length) throw new Error(`Choose ${isMultiFile ? "files" : "a file"} first.`);
      if (isDocxInput) {
        const [{ default: mammoth }, { default: html2pdf }] = await Promise.all([
          import("mammoth"),
          import("html2pdf.js"),
        ]);
        const { value } = await mammoth.convertToHtml({
          arrayBuffer: await files[0].arrayBuffer(),
        });
        const container = document.createElement("article");
        container.style.cssText = "position:fixed;left:-10000px;top:0;width:760px;padding:48px;background:#fff;color:#111;font:16px/1.6 Georgia,serif";
        container.innerHTML = value;
        document.body.appendChild(container);
        try {
          const options = {
            margin: 12,
            image: { type: "jpeg" as const, quality: 0.94 },
            html2canvas: { scale: 1.5, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
          };
          const blob = await html2pdf().set(options).from(container).outputPdf("blob");
          addOutput(blob, `${files[0].name.replace(/\.docx$/iu, "")}.pdf`, "PDF");
        } finally {
          container.remove();
        }
        return;
      }

      if (isImageInput) {
        const pdf = await PDFDocument.create();
        for (const file of files) {
          const bitmap = await createImageBitmap(file);
          const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Image rendering is unavailable in this browser.");
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          const imageBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => blob ? resolve(blob) : reject(new Error("Unable to convert an image.")),
              file.type === "image/png" ? "image/png" : "image/jpeg",
              0.94,
            );
          });
          const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
          const image = imageBlob.type === "image/png"
            ? await pdf.embedPng(imageBytes)
            : await pdf.embedJpg(imageBytes);
          const page = pdf.addPage([image.width * 0.75, image.height * 0.75]);
          page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
        }
        addOutput(makePdfBlob(await pdf.save()), "images.pdf", "PDF");
        return;
      }

      if (slug === "pdf-merger") {
        if (files.length < 2) throw new Error("Choose at least two PDF files to merge.");
        const merged = await PDFDocument.create();
        for (const file of files) {
          const source = await PDFDocument.load(await file.arrayBuffer());
          const copiedPages = await merged.copyPages(source, source.getPageIndices());
          copiedPages.forEach((page) => merged.addPage(page));
        }
        addOutput(makePdfBlob(await merged.save()), "merged.pdf", "Merged PDF");
        return;
      }

      const file = files[0];
      if (slug === "pdf-to-images") {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const documentTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        const pdfDocument = await documentTask.promise;
        const archive = new JSZip();
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.6 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
          await page.render({ canvas, viewport }).promise;
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (imageBlob: Blob | null) => imageBlob ? resolve(imageBlob) : reject(new Error("Unable to export a PDF page.")),
              imageFormat === "png" ? "image/png" : "image/jpeg",
              0.92,
            );
          });
          archive.file(`${pdfBaseName(file.name)}-page-${String(pageNumber).padStart(3, "0")}.${imageFormat}`, blob);
          page.cleanup();
        }
        await documentTask.destroy();
        const blob = await archive.generateAsync({ type: "blob" });
        addOutput(blob, `${pdfBaseName(file.name)}-pages.zip`, "Page images");
        return;
      }

      if (slug === "pdf-to-text") {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const documentTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        const pdfDocument = await documentTask.promise;
        const extracted: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const content = await page.getTextContent();
          extracted.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
        }
        await documentTask.destroy();
        const blob = new Blob([extracted.join("\n\n")], { type: "text/plain;charset=utf-8" });
        addOutput(blob, `${pdfBaseName(file.name)}.txt`, "Extracted text");
        return;
      }

      const pdf = await PDFDocument.load(await file.arrayBuffer());
      if (slug === "pdf-splitter") {
        const selectedPages = parsePages(pages, pdf.getPageCount());
        const extracted = await PDFDocument.create();
        const copiedPages = await extracted.copyPages(pdf, selectedPages);
        copiedPages.forEach((page) => extracted.addPage(page));
        addOutput(makePdfBlob(await extracted.save()), `${pdfBaseName(file.name)}-pages.pdf`, "Selected pages");
      } else if (slug === "pdf-page-rotator") {
        const selectedPages = pages.trim()
          ? new Set(parsePages(pages, pdf.getPageCount()))
          : new Set(pdf.getPageIndices());
        pdf.getPages().forEach((page, index) => {
          if (selectedPages.has(index)) {
            page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
          }
        });
        addOutput(makePdfBlob(await pdf.save()), `${pdfBaseName(file.name)}-rotated.pdf`, "Rotated PDF");
      } else if (slug === "pdf-metadata-remover") {
        const infoRef = pdf.context.trailerInfo.Info;
        if (infoRef) {
          const info = pdf.context.lookup(infoRef);
          if (info instanceof PDFDict) {
            ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate", "Trapped"].forEach((key) => info.delete(PDFName.of(key)));
          }
        }
        pdf.catalog.delete(PDFName.of("Metadata"));
        addOutput(makePdfBlob(await pdf.save()), `${pdfBaseName(file.name)}-metadata-removed.pdf`, "Cleaned PDF");
      } else if (slug === "pdf-compressor") {
        const originalSize = file.size;
        const blob = makePdfBlob(await pdf.save({ useObjectStreams: true }));
        const change = originalSize > 0
          ? `${Math.round((1 - blob.size / originalSize) * 100)}% ${blob.size <= originalSize ? "smaller" : "larger"}`
          : formatBytes(blob.size);
        addOutput(blob, `${pdfBaseName(file.name)}-optimized.pdf`, "Optimized PDF");
        setFeedback(`Optimization complete: ${formatBytes(originalSize)} → ${formatBytes(blob.size)} (${change}).`);
      }
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Unable to process this file.");
      setIsError(true);
    } finally {
      setIsWorking(false);
    }
  }

  const title = {
    "pdf-merger": "Merge PDFs",
    "pdf-splitter": "Extract PDF pages",
    "pdf-compressor": "Optimize PDF",
    "pdf-to-images": "Export PDF pages",
    "images-to-pdf": "Create PDF from images",
    "pdf-page-rotator": "Rotate PDF pages",
    "pdf-metadata-remover": "Remove PDF metadata",
    "text-to-pdf": "Create PDF from text",
    "docx-to-pdf": "Convert DOCX to PDF",
    "pdf-to-text": "Extract PDF text",
  }[slug];

  const accept = isImageInput ? imageAccept : isDocxInput ? docxAccept : pdfAccept;
  const buttonLabel = {
    "pdf-merger": "Merge PDFs",
    "pdf-splitter": "Extract pages",
    "pdf-compressor": "Optimize PDF",
    "pdf-to-images": "Convert pages to images",
    "images-to-pdf": "Create PDF",
    "pdf-page-rotator": "Rotate pages",
    "pdf-metadata-remover": "Remove metadata",
    "text-to-pdf": "Create PDF",
    "docx-to-pdf": "Convert to PDF",
    "pdf-to-text": "Extract text",
  }[slug];

  return (
    <div className="space-y-6 pt-6">
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      {!isTextInput && (
        <div className="space-y-3">
          <label htmlFor="pdf-tool-files" className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--line)] bg-[var(--paper)] px-4 text-center hover:border-[var(--accent-dark)]">
            <FilePlus2 aria-hidden="true" className="size-5 text-[var(--accent-dark)]" />
            <span className="text-sm font-semibold text-[var(--ink)]">Choose {isMultiFile ? "files" : "a file"}</span>
            <span className="text-xs text-[var(--muted)]">{isImageInput ? "JPG, PNG, or WebP images" : isDocxInput ? "DOCX documents" : "PDF documents"}</span>
          </label>
          <input id="pdf-tool-files" type="file" accept={accept} multiple={isMultiFile} onChange={(event) => chooseFiles(event.target.files)} className="sr-only" />
          {files.length > 0 && (
            <ul className="divide-y divide-[var(--line)] rounded-md border border-[var(--line)] bg-[var(--surface)]">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2 text-xs">
                  <span className="min-w-0 truncate text-[var(--ink)]">{index + 1}. {file.name}</span>
                  <span className="shrink-0 text-[var(--muted)]">{formatBytes(file.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {needsPageSelection && (
        <label className="block text-sm font-semibold text-[var(--ink)]">
          Pages {slug === "pdf-page-rotator" ? "(leave blank for all pages)" : "to extract"}
          <input value={pages} onChange={(event) => { clearOutput(); setFeedback(""); setPages(event.target.value); }} placeholder="1, 3-5, 8" className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
        </label>
      )}

      {slug === "pdf-page-rotator" && (
        <label className="block text-sm font-semibold text-[var(--ink)]">
          Rotation
          <select value={rotation} onChange={(event) => { clearOutput(); setFeedback(""); setRotation(Number(event.target.value)); }} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]">
            <option value={90}>90° clockwise</option>
            <option value={180}>180°</option>
            <option value={270}>270° clockwise</option>
          </select>
        </label>
      )}

      {slug === "pdf-to-images" && (
        <label className="block text-sm font-semibold text-[var(--ink)]">
          Image format
          <select value={imageFormat} onChange={(event) => { clearOutput(); setFeedback(""); setImageFormat(event.target.value as "png" | "jpg"); }} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]">
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </label>
      )}

      {isTextInput && (
        <label className="block text-sm font-semibold text-[var(--ink)]">
          Text
          <textarea value={text} onChange={(event) => { clearOutput(); setFeedback(""); setText(event.target.value); }} rows={10} placeholder="Write or paste your text here..." className="mt-2 min-h-56 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={run} disabled={isWorking || (!files.length && !isTextInput) || (isTextInput && !text.trim())} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45">
          {isWorking ? "Processing..." : buttonLabel}
        </button>
        {(files.length > 0 || text) && (
          <button type="button" onClick={() => { clearOutput(); setFiles([]); setText(""); setPages(""); setFeedback(""); setIsError(false); }} aria-label="Clear files and result" className="grid size-10 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)]">
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <p aria-live="polite" className={`min-h-5 text-xs ${isError ? "text-red-800" : "text-[var(--muted)]"}`}>{feedback}</p>

      {output && (
        <a href={output.url} download={output.name} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]">
          <Download aria-hidden="true" className="size-4" />
          Download {output.label} · {formatBytes(output.blob.size)}
        </a>
      )}

      <p className="text-xs leading-5 text-[var(--muted)]">
        {slug === "pdf-compressor"
          ? "Optimization is lossless and may not reduce every file. Embedded images are not downsampled."
          : slug === "pdf-to-text"
            ? "Only selectable text can be extracted; scanned pages need OCR. Files are processed locally."
            : slug === "docx-to-pdf"
              ? "Complex Word layouts may look different in the converted PDF. The file is processed locally."
              : "Files are processed locally in your browser and are not uploaded."}
      </p>
    </div>
  );
}