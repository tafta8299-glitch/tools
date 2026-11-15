"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const presets = [
  "#E96D56",
  "#5B73E8",
  "#22A88A",
  "#E3B341",
  "#D85A98",
  "#27364B",
  "#F1F0E8",
  "#242424",
];

type RGB = { red: number; green: number; blue: number };

function normalizeHex(value: string): string | undefined {
  const digits = value.trim().replace(/^#/, "");

  if (/^[\da-f]{3}$/i.test(digits)) {
    return `#${digits
      .split("")
      .map((digit) => `${digit}${digit}`)
      .join("")}`.toUpperCase();
  }

  if (/^[\da-f]{6}$/i.test(digits)) {
    return `#${digits.toUpperCase()}`;
  }

  return undefined;
}

function hexToRgb(hex: string): RGB {
  const value = hex.slice(1);

  return {
    red: Number.parseInt(value.slice(0, 2), 16),
    green: Number.parseInt(value.slice(2, 4), 16),
    blue: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHsl({ red, green, blue }: RGB): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;
  let saturation = 0;

  if (difference !== 0) {
    saturation = difference / (1 - Math.abs(2 * lightness - 1));

    switch (maximum) {
      case r:
        hue = ((g - b) / difference) % 6;
        break;
      case g:
        hue = (b - r) / difference + 2;
        break;
      default:
        hue = (r - g) / difference + 4;
    }

    hue = Math.round(hue * 60);
    if (hue < 0) {
      hue += 360;
    }
  }

  return [Math.round(hue), Math.round(saturation * 100), Math.round(lightness * 100)];
}

function getContrastColor({ red, green, blue }: RGB): string {
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.55 ? "#17231d" : "#ffffff";
}

export function ColorPicker() {
  const [hex, setHex] = useState("#E96D56");
  const [hexInput, setHexInput] = useState("#E96D56");
  const [copiedFormat, setCopiedFormat] = useState("");
  const [feedback, setFeedback] = useState("");
  const normalizedInput = normalizeHex(hexInput);
  const inputIsValid = normalizedInput !== undefined;
  const activeHex = normalizedInput ?? hex;
  const rgb = hexToRgb(activeHex);
  const [hue, saturation, lightness] = rgbToHsl(rgb);
  const values = [
    { label: "HEX", value: activeHex },
    { label: "RGB", value: `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})` },
    { label: "HSL", value: `hsl(${hue}, ${saturation}%, ${lightness}%)` },
  ];

  function changeHex(value: string) {
    setHexInput(value);
    setCopiedFormat("");
    setFeedback("");

    const normalized = normalizeHex(value);
    if (normalized) {
      setHex(normalized);
      setHexInput(normalized);
    }
  }

  function selectColor(value: string) {
    const normalized = normalizeHex(value);
    if (!normalized) {
      return;
    }

    setHex(normalized);
    setHexInput(normalized);
    setCopiedFormat("");
    setFeedback("");
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedFormat(label);
      setFeedback(`${label} value copied.`);
    } catch {
      setCopiedFormat("");
      setFeedback("Clipboard access is unavailable.");
    }
  }

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
      <div className="space-y-6">
        <div>
          <label
            htmlFor="color-hex"
            className="mb-2 block text-sm font-semibold text-[var(--ink)]"
          >
            Choose a color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={activeHex}
              onChange={(event) => selectColor(event.target.value)}
              aria-label="Open color picker"
              className="size-12 shrink-0 cursor-pointer rounded-md border border-[var(--line)] bg-[var(--surface)] p-1.5"
            />
            <input
              id="color-hex"
              type="text"
              value={hexInput}
              onChange={(event) => changeHex(event.target.value)}
              aria-invalid={!inputIsValid}
              aria-describedby={!inputIsValid ? "hex-error" : undefined}
              spellCheck={false}
              autoComplete="off"
              placeholder="#RRGGBB"
              className="h-12 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 font-mono text-sm uppercase text-[var(--ink)] outline-none transition-colors placeholder:normal-case placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)] aria-invalid:border-red-700"
            />
          </div>
          {!inputIsValid && (
            <p id="hex-error" className="mt-2 text-xs text-red-800">
              Enter a 3- or 6-digit hexadecimal color, such as #36C or #3366CC.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-[var(--ink)]">
            Quick colors
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => selectColor(preset)}
                aria-label={`Select color ${preset}`}
                aria-pressed={activeHex === preset}
                title={preset}
                className="size-9 rounded-md border border-black/10 shadow-sm outline-offset-2 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-dark)]"
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </fieldset>

        <div
          aria-live="polite"
          className="min-h-5 text-xs text-[var(--muted)]"
        >
          {feedback}
        </div>
      </div>

      <div>
        <div
          className="flex min-h-48 items-end rounded-md border border-[var(--line)] p-5 sm:min-h-56 sm:p-7"
          style={{ backgroundColor: activeHex, color: getContrastColor(rgb) }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] opacity-80">
              Selected color
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold">{activeHex}</p>
          </div>
        </div>

        <dl className="mt-5">
          {values.map(({ label, value }) => (
            <div
              key={label}
              className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--line)] py-2"
            >
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  {label}
                </dt>
                <dd className="mt-0.5 break-all font-mono text-sm text-[var(--ink)]">
                  {value}
                </dd>
              </div>
              <button
                type="button"
                onClick={() => copyValue(label, value)}
                aria-label={`Copy ${label} value`}
                title={`Copy ${label} value`}
                className="grid size-9 shrink-0 place-items-center rounded-sm text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              >
                {copiedFormat === label ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  <Copy aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}