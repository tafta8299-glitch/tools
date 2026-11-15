"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { Download, Files, X } from "lucide-react";
import { PDFDict, PDFDocument, PDFName, degrees } from "pdf-lib";
import { formatBytes } from "@/components/tools/image/image-utils";

type DocumentOperation =
  | "pdf-compress"
  | "pdf-rotate"
  | "pdf-clean"
  | "pdf-split"
  | "pdf-to-images"
  | "pdf-to-text"
  | "docx-to-pdf";

const operationLabels: Record<DocumentOperation, string> = {
  "pdf-compress": "Optimize PDFs",
  "pdf-rotate": "Rotate PDF pages",
  "pdf-clean": "Remove PDF metadata",
  "pdf-split": "Extract PDF pages",
  "pdf-to-images": "Convert PDF pages to images",
  "pdf-to-text": "Extract text from PDFs",
  "docx-to-pdf": "Convert Word documents to PDF",
};

const maximumFiles = 25;

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/u, "").replace(/[^a-zA-Z0-9_-]+/gu, "-") || "document";
}

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

function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

function pdfPagesToZipName(filename: string, pageNumber: number, extension: string): string {
  return `${baseName(filename)}/${baseName(filename)}-page-${String(pageNumber).padStart(3, "0")}.${extension}`;
}

export function BulkDocumentProcessor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const outputUrlRef = useRef("");
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState<DocumentOperation>("pdf-compress");
  const [rotation, setRotation] = useState(90);
  const [pages, setPages] = useState("");
  const [imageFormat, setImageFormat] = useState<"jpg" | "png">("jpg");
  const [output, setOutput] = useState<{ url: string; blob: Blob; count: number } | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  function clearOutput() {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    outputUrlRef.current = "";
    setOutput(null);
  }

  function clearAll() {
    clearOutput();
    setFiles([]);
    setPages("");
    setProgress(0);
    setFeedback("");
    setIsError(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFiles(selectedFiles: FileList | null) {
    clearOutput();
    setFeedback("");
    setIsError(false);
    setProgress(0);
    const nextFiles = selectedFiles ? Array.from(selectedFiles) : [];
    setFiles(nextFiles.slice(0, maximumFiles));
    if (nextFiles.length > maximumFiles) setFeedback(`Only the first ${maximumFiles} files were added.`);
  }

  async function processPdf(file: File, archive: JSZip): Promise<void> {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const filename = baseName(file.name);

    if (operation === "pdf-compress") {
      archive.file(`${filename}/${filename}-optimized.pdf`, pdfBlob(await pdf.save({ useObjectStreams: true })));
    } else if (operation === "pdf-clean") {
      const infoRef = pdf.context.trailerInfo.Info;
      if (infoRef) {
        const info = pdf.context.lookup(infoRef);
        if (info instanceof PDFDict) {
          ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate", "Trapped"].forEach((key) => info.delete(PDFName.of(key)));
        }
      }
      pdf.catalog.delete(PDFName.of("Metadata"));
      archive.file(`${filename}/${filename}-metadata-removed.pdf`, pdfBlob(await pdf.save()));
    } else if (operation === "pdf-rotate") {
      const selectedPages = pages.trim()
        ? new Set(parsePages(pages, pdf.getPageCount()))
        : new Set(pdf.getPageIndices());
      pdf.getPages().forEach((page, index) => {
        if (selectedPages.has(index)) page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
      });
      archive.file(`${filename}/${filename}-rotated.pdf`, pdfBlob(await pdf.save()));
    } else if (operation === "pdf-split") {
      const selectedPages = parsePages(pages, pdf.getPageCount());
      const extracted = await PDFDocument.create();
      const copiedPages = await extracted.copyPages(pdf, selectedPages);
      copiedPages.forEach((page) => extracted.addPage(page));
      archive.file(`${filename}/${filename}-pages.pdf`, pdfBlob(await extracted.save()));
    } else if (operation === "pdf-to-images") {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const documentTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdfDocument = await documentTask.promise;
      try {
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.6 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Page rendering is unavailable in this browser.");
          await page.render({ canvas, viewport }).promise;
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (image) => image ? resolve(image) : reject(new Error("Unable to export a page image.")),
              imageFormat === "png" ? "image/png" : "image/jpeg",
              0.92,
            );
          });
          archive.file(pdfPagesToZipName(file.name, pageNumber, imageFormat), blob);
          page.cleanup();
        }
      } finally {
        await documentTask.destroy();
      }
    } else if (operation === "pdf-to-text") {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const documentTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdfDocument = await documentTask.promise;
      const extracted: string[] = [];
      try {
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const content = await page.getTextContent();
          extracted.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
          page.cleanup();
        }
      } finally {
        await documentTask.destroy();
      }
      archive.file(`${filename}/${filename}.txt`, extracted.join("\n\n"));
    }
  }

  async function processDocx(file: File, archive: JSZip): Promise<void> {
    const [{ default: mammoth }, { default: html2pdf }] = await Promise.all([
      import("mammoth"),
      import("html2pdf.js"),
    ]);
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const container = document.createElement("article");
    container.style.cssText = "position:fixed;left:-10000px;top:0;width:760px;padding:48px;background:#fff;color:#111;font:16px/1.6 Georgia,serif";
    container.innerHTML = value;
    document.body.appendChild(container);
    try {
      const blob = await html2pdf()
        .set({ margin: 12, image: { type: "jpeg" as const, quality: 0.94 }, html2canvas: { scale: 1.5, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const } })
        .from(container)
        .outputPdf("blob");
      archive.file(`${baseName(file.name)}/${baseName(file.name)}.pdf`, blob);
    } finally {
      container.remove();
    }
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

    for (const [index, file] of files.entries()) {
      try {
        if (operation === "docx-to-pdf") {
          if (!file.name.toLowerCase().endsWith(".docx")) throw new Error("Choose a DOCX file.");
          await processDocx(file, archive);
        } else {
          if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            throw new Error("Choose a PDF file.");
          }
          await processPdf(file, archive);
        }
        processed += 1;
      } catch (caught) {
        failures.push(`${file.name}: ${caught instanceof Error ? caught.message : "Could not process this file."}`);
      }
      setProgress(Math.round(((index + 1) / files.length) * 100));
    }

    try {
      if (processed === 0) throw new Error(failures[0] ?? "No files could be processed.");
      const blob = await archive.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutput({ url, blob, count: processed });
      setFeedback(
        failures.length
          ? `${processed} ${processed === 1 ? "file" : "files"} ready. ${failures.length} could not be processed: ${failures.slice(0, 3).join(" ")}`
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

  const acceptsDocx = operation === "docx-to-pdf";

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Batch operation
            <select value={operation} disabled={isWorking} onChange={(event) => { setOperation(event.target.value as DocumentOperation); setFiles([]); clearOutput(); setFeedback(""); if (inputRef.current) inputRef.current.value = ""; }} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal text-[var(--ink)]">
              {Object.entries(operationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <div>
            <label htmlFor="bulk-document-files" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
              Choose {acceptsDocx ? "Word documents" : "PDF files"}
            </label>
            <input
              ref={inputRef}
              id="bulk-document-files"
              type="file"
              multiple
              accept={acceptsDocx ? ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf,.pdf"}
              disabled={isWorking}
              onChange={(event) => chooseFiles(event.target.files)}
              className="block min-h-12 w-full cursor-pointer rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--ink)] file:mr-3 file:min-h-12 file:border-0 file:bg-[var(--paper)] file:px-3 file:text-sm file:font-semibold file:text-[var(--ink)] disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">Up to {maximumFiles} files. Each result is kept in its own folder in the ZIP.</p>
          </div>

          {operation === "pdf-rotate" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-[var(--ink)]">Rotation<select value={rotation} disabled={isWorking} onChange={(event) => setRotation(Number(event.target.value))} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal"><option value={90}>90° clockwise</option><option value={180}>180°</option><option value={270}>270° clockwise</option></select></label>
              <label className="text-sm font-semibold text-[var(--ink)]">Pages<input value={pages} disabled={isWorking} onChange={(event) => setPages(event.target.value)} placeholder="All pages" className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal" /></label>
            </div>
          ) : null}

          {operation === "pdf-split" ? (
            <label className="block text-sm font-semibold text-[var(--ink)]">Pages to extract<input value={pages} disabled={isWorking} onChange={(event) => setPages(event.target.value)} placeholder="1, 3-5, 8" className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal" /></label>
          ) : null}

          {operation === "pdf-to-images" ? (
            <label className="block text-sm font-semibold text-[var(--ink)]">Image format<select value={imageFormat} disabled={isWorking} onChange={(event) => setImageFormat(event.target.value as "jpg" | "png")} className="mt-2 h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-normal"><option value="jpg">JPG</option><option value="png">PNG</option></select></label>
          ) : null}

          <div className="flex gap-3">
            <button type="button" onClick={processFiles} disabled={!files.length || isWorking} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45">
              <Files aria-hidden="true" className="size-4" />
              {isWorking ? `Processing ${progress}%` : "Process files"}
            </button>
            {files.length ? <button type="button" onClick={clearAll} disabled={isWorking} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--paper)] disabled:opacity-50"><X aria-hidden="true" className="size-4" />Clear</button> : null}
          </div>

          {isWorking ? <progress aria-label="Document batch progress" value={progress} max={100} className="h-2 w-full accent-[var(--accent-dark)]" /> : null}
          <p aria-live="polite" className={`min-h-5 text-xs ${isError ? "text-red-800" : "text-[var(--muted)]"}`}>{feedback}</p>
          <p className="text-xs leading-5 text-[var(--muted)]">Files are processed on your device. Scanned PDFs need OCR before text can be extracted.</p>
        </div>

        <section aria-labelledby="bulk-document-queue-heading" className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <h3 id="bulk-document-queue-heading" className="text-sm font-semibold text-[var(--ink)]">Batch queue</h3>
            <span className="text-xs text-[var(--muted)]">{files.length} {files.length === 1 ? "file" : "files"}</span>
          </div>
          {files.length ? (
            <ul className="divide-y divide-[var(--line)]">
              {files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-3 py-3 text-xs"><span className="min-w-0 truncate text-[var(--ink)]">{index + 1}. {file.name}</span><span className="shrink-0 text-[var(--muted)]">{formatBytes(file.size)}</span></li>)}
            </ul>
          ) : <p className="py-10 text-center text-sm text-[var(--muted)]">Selected files will appear here.</p>}
          {output ? <a href={output.url} download="trovflex-documents.zip" className="mt-5 inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-md bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-dark)]"><span className="inline-flex items-center gap-2"><Download aria-hidden="true" className="size-4" />Download ZIP · {output.count} {output.count === 1 ? "file" : "files"}</span><span className="text-xs font-medium text-white/90">{formatBytes(output.blob.size)}</span></a> : null}
        </section>
      </div>
    </div>
  );
}