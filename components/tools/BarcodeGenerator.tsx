"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ScanBarcode } from "lucide-react";
import JsBarcode from "jsbarcode";

const formats = [
  { value: "CODE128", label: "Code 128" },
  { value: "CODE39", label: "Code 39" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC", label: "UPC-A" },
  { value: "ITF14", label: "ITF-14" },
] as const;

type BarcodeFormat = (typeof formats)[number]["value"];

const formatGuidance: Record<BarcodeFormat, string> = {
  CODE128: "Enter letters, numbers, or symbols, up to 150 characters.",
  CODE39:
    "Enter up to 80 letters, numbers, spaces, or . - $ / + % characters.",
  EAN13:
    "Enter 12 digits. A 13th digit is optional, but must be the correct check digit.",
  EAN8:
    "Enter 7 digits. An 8th digit is optional, but must be the correct check digit.",
  UPC: "Enter 11 digits. A 12th digit is optional, but must be the correct check digit.",
  ITF14:
    "Enter 13 digits. A 14th digit is optional, but must be the correct check digit.",
};

function hasValidCheckDigit(value: string): boolean {
  const data = value.slice(0, -1);
  const checkDigit = Number(value.at(-1));
  let sum = 0;

  for (let index = data.length - 1; index >= 0; index -= 1) {
    const distanceFromRight = data.length - 1 - index;
    sum += Number(data[index]) * (distanceFromRight % 2 === 0 ? 3 : 1);
  }

  return (10 - (sum % 10)) % 10 === checkDigit;
}

function getValidationError(format: BarcodeFormat, value: string): string {
  if (!value) {
    return "";
  }

  if (format === "CODE128") {
    if (value.length > 150) {
      return "Code 128 values must be 150 characters or fewer.";
    }

    return "";
  }

  if (format === "CODE39") {
    if (!/^[0-9A-Z .\-$/+%]*$/i.test(value)) {
      return "Code 39 supports letters, numbers, spaces, and . - $ / + % characters.";
    }

    if (value.length > 80) {
      return "Code 39 values must be 80 characters or fewer.";
    }

    return "";
  }

  if (!/^\d+$/.test(value)) {
    return "This barcode format accepts digits only.";
  }

  const lengths: Record<Exclude<BarcodeFormat, "CODE128" | "CODE39">, [number, number]> = {
    EAN13: [12, 13],
    EAN8: [7, 8],
    UPC: [11, 12],
    ITF14: [13, 14],
  };
  const [dataLength, fullLength] = lengths[format];

  if (value.length !== dataLength && value.length !== fullLength) {
    return `${format === "UPC" ? "UPC-A" : format.replace("EAN", "EAN-").replace("ITF", "ITF-")} values need ${dataLength} digits, with an optional check digit.`;
  }

  if (value.length === fullLength && !hasValidCheckDigit(value)) {
    return "The check digit does not match this value. Check the digits and try again.";
  }

  return "";
}

export function BarcodeGenerator() {
  const [value, setValue] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [lineColor, setLineColor] = useState("#17231d");
  const [background, setBackground] = useState("#ffffff");
  const [result, setResult] = useState<{
    key: string;
    error?: string;
  }>();
  const svgRef = useRef<SVGSVGElement>(null);
  const normalizedValue = value.trim();
  const validationError = getValidationError(format, normalizedValue);
  const generationKey = JSON.stringify([
    normalizedValue,
    format,
    height,
    displayValue,
    lineColor,
    background,
  ]);
  const currentResult = result?.key === generationKey ? result : undefined;
  const error = validationError || currentResult?.error || "";
  const isReady = Boolean(normalizedValue) && !error && currentResult !== undefined;
  const isGenerating = Boolean(normalizedValue) && !error && !currentResult;

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    svg.replaceChildren();

    if (!normalizedValue || validationError) {
      return;
    }

    let current = true;
    const timeoutId = window.setTimeout(() => {
      try {
        JsBarcode(svg, normalizedValue, {
          format,
          width: 2,
          height,
          displayValue,
          background,
          lineColor,
          margin: 12,
          font: "monospace",
          fontSize: 16,
        });

        if (current) {
          setResult({ key: generationKey });
        }
      } catch {
        if (current) {
          svg.replaceChildren();
          setResult({
            key: generationKey,
            error: "This value could not be encoded in the selected barcode format.",
          });
        }
      }
    }, 120);

    return () => {
      current = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    background,
    displayValue,
    format,
    generationKey,
    height,
    lineColor,
    normalizedValue,
    validationError,
  ]);

  function downloadSvg() {
    const svg = svgRef.current;

    if (!svg || !isReady) {
      return;
    }

    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const source = new XMLSerializer().serializeToString(copy);
    const url = URL.createObjectURL(
      new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `toolbox-${format.toLowerCase()}.svg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="grid gap-8 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-7">
      <div className="space-y-5">
        <div>
          <label
            htmlFor="barcode-value"
            className="mb-2 block text-sm font-semibold text-[var(--ink)]"
          >
            Barcode value
          </label>
          <input
            id="barcode-value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={150}
            aria-describedby="barcode-format-guidance"
            placeholder="Enter text or numbers"
            className="h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)]"
          />
          <p
            id="barcode-format-guidance"
            aria-live="polite"
            className="mt-2 min-h-5 text-xs leading-5 text-[var(--muted)]"
          >
            {formatGuidance[format]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="barcode-format"
              className="mb-2 block text-sm font-semibold text-[var(--ink)]"
            >
              Barcode format
            </label>
            <select
              id="barcode-format"
              value={format}
              onChange={(event) => setFormat(event.target.value as BarcodeFormat)}
              className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]"
            >
              {formats.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="barcode-height"
              className="mb-2 block text-sm font-semibold text-[var(--ink)]"
            >
              Bar height
            </label>
            <select
              id="barcode-height"
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
              className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]"
            >
              {[64, 88, 112, 136].map((option) => (
                <option key={option} value={option}>
                  {option} px
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="inline-flex min-h-10 items-center gap-2.5 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={displayValue}
            onChange={(event) => setDisplayValue(event.target.checked)}
            className="size-4 accent-[var(--accent-dark)]"
          />
          Show value below barcode
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[var(--ink)]">
            Colors
          </legend>
          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2.5 text-sm text-[var(--muted)]">
              <input
                type="color"
                value={lineColor}
                onChange={(event) => setLineColor(event.target.value)}
                aria-label="Barcode color"
                className="size-9 cursor-pointer rounded border border-[var(--line)] bg-[var(--surface)] p-1"
              />
              Bars
            </label>
            <label className="inline-flex items-center gap-2.5 text-sm text-[var(--muted)]">
              <input
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                aria-label="Barcode background color"
                className="size-9 cursor-pointer rounded border border-[var(--line)] bg-[var(--surface)] p-1"
              />
              Background
            </label>
          </div>
        </fieldset>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)] p-5 text-center sm:p-6">
        <div className="flex min-h-44 w-full items-center justify-center overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
          <svg
            ref={svgRef}
            aria-label={`${formats.find((option) => option.value === format)?.label} barcode preview`}
            role={isReady ? "img" : undefined}
            className={isReady ? "h-auto max-w-full" : "hidden"}
          />
          {!isReady && (
            <div className="flex flex-col items-center gap-3 px-4 text-[var(--muted)]">
              <ScanBarcode aria-hidden="true" className="size-9 opacity-70" />
              <span className="text-sm leading-5">
                {normalizedValue && error
                  ? "Fix the value to preview your barcode"
                  : "Enter a value to create your barcode"}
              </span>
            </div>
          )}
        </div>

        <p aria-live="polite" className="mt-4 min-h-5 text-xs text-[var(--muted)]">
          {error ||
            (isGenerating
              ? "Updating preview..."
              : isReady
                ? "SVG preview ready"
                : "")}
        </p>

        {isReady && (
          <button
            type="button"
            onClick={downloadSvg}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]"
          >
            <Download aria-hidden="true" className="size-4" />
            Download SVG
          </button>
        )}
      </div>
    </div>
  );
}