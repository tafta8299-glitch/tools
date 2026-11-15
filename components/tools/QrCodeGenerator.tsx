"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const sizes = [128, 192, 256, 320];

export function QrCodeGenerator() {
  const [value, setValue] = useState("");
  const [size, setSize] = useState(256);
  const [errorCorrection, setErrorCorrection] =
    useState<ErrorCorrectionLevel>("M");
  const [foreground, setForeground] = useState("#17231d");
  const [background, setBackground] = useState("#ffffff");
  const [result, setResult] = useState<{
    key: string;
    imageUrl?: string;
    error?: string;
  }>();
  const generationKey = JSON.stringify([
    value,
    size,
    errorCorrection,
    foreground,
    background,
  ]);
  const currentResult = result?.key === generationKey ? result : undefined;
  const imageUrl = currentResult?.imageUrl ?? "";
  const error = currentResult?.error ?? "";
  const isGenerating = Boolean(value.trim()) && !currentResult;

  useEffect(() => {
    if (!value.trim()) {
      return;
    }

    let current = true;

    const timeoutId = window.setTimeout(() => {
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorCorrection,
        color: { dark: foreground, light: background },
      })
        .then((url) => {
          if (current) {
            setResult({ key: generationKey, imageUrl: url });
          }
        })
        .catch(() => {
          if (current) {
            setResult({
              key: generationKey,
              error:
                "This content is too long to encode. Try shortening it or lowering the correction level.",
            });
          }
        });
    }, 120);

    return () => {
      current = false;
      window.clearTimeout(timeoutId);
    };
  }, [background, errorCorrection, foreground, generationKey, size, value]);

  return (
    <div className="grid gap-8 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-7">
      <div className="space-y-5">
        <div>
          <label
            htmlFor="qr-content"
            className="mb-2 block text-sm font-semibold text-[var(--ink)]"
          >
            Text or URL
          </label>
          <textarea
            id="qr-content"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="https://example.com or any text"
            className="w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)]"
          />
          <p className="mt-1.5 flex justify-between gap-3 text-xs text-[var(--muted)]">
            <span>Up to 2,000 characters</span>
            <span>{value.length.toLocaleString()} / 2,000</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="qr-size"
              className="mb-2 block text-sm font-semibold text-[var(--ink)]"
            >
              Image size
            </label>
            <select
              id="qr-size"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]"
            >
              {sizes.map((option) => (
                <option key={option} value={option}>
                  {option} x {option} px
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="qr-correction"
              className="mb-2 block text-sm font-semibold text-[var(--ink)]"
            >
              Error correction
            </label>
            <select
              id="qr-correction"
              value={errorCorrection}
              onChange={(event) =>
                setErrorCorrection(event.target.value as ErrorCorrectionLevel)
              }
              className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]"
            >
              <option value="L">Low</option>
              <option value="M">Medium</option>
              <option value="Q">Quartile</option>
              <option value="H">High</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[var(--ink)]">
            Colors
          </legend>
          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2.5 text-sm text-[var(--muted)]">
              <input
                type="color"
                value={foreground}
                onChange={(event) => setForeground(event.target.value)}
                aria-label="QR code color"
                className="size-9 cursor-pointer rounded border border-[var(--line)] bg-[var(--surface)] p-1"
              />
              Code
            </label>
            <label className="inline-flex items-center gap-2.5 text-sm text-[var(--muted)]">
              <input
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                aria-label="QR code background color"
                className="size-9 cursor-pointer rounded border border-[var(--line)] bg-[var(--surface)] p-1"
              />
              Background
            </label>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col items-center justify-center rounded-md border border-[var(--line)] bg-[var(--paper)] p-5 text-center sm:p-6">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Generated QR code preview"
            width={size}
            height={size}
            unoptimized
            className="h-auto max-w-full rounded-sm bg-white shadow-sm"
          />
        ) : (
          <div className="grid size-48 place-items-center rounded-md border border-dashed border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]">
            <div className="flex flex-col items-center gap-3 px-4">
              <QrCode aria-hidden="true" className="size-9 opacity-70" />
              <span className="text-sm leading-5">
                Enter text or a URL to create your QR code
              </span>
            </div>
          </div>
        )}

        <p aria-live="polite" className="mt-4 min-h-5 text-xs text-[var(--muted)]">
          {error || (isGenerating ? "Updating preview..." : imageUrl ? "PNG preview ready" : "")}
        </p>

        {imageUrl && (
          <a
            href={imageUrl}
            download="toolbox-qr-code.png"
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]"
          >
            <Download aria-hidden="true" className="size-4" />
            Download PNG
          </a>
        )}
      </div>
    </div>
  );
}