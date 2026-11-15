"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";

type Mode = "encode" | "decode";

function encodeBase64(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    for (const byte of chunk) {
      binary += String.fromCharCode(byte);
    }
  }

  const encoded = btoa(binary);
  return urlSafe
    ? encoded.replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "")
    : encoded;
}

function decodeBase64(value: string): string {
  const input = value.replace(/\s/gu, "");

  if (!input) {
    return "";
  }

  if (!/^[A-Za-z\d+/_-]*={0,2}$/u.test(input)) {
    throw new Error("Use only Base64 letters, numbers, +, /, -, _, and padding.");
  }

  const payload = input.replace(/=+$/u, "");
  const suppliedPadding = input.length - payload.length;
  const expectedPadding = (4 - (payload.length % 4)) % 4;

  if (
    payload.length % 4 === 1 ||
    (suppliedPadding > 0 && suppliedPadding !== expectedPadding)
  ) {
    throw new Error("This is not a valid Base64 string. Check its length and padding.");
  }

  const normalized = payload.replace(/-/gu, "+").replace(/_/gu, "/");
  let binary: string;

  try {
    binary = atob(normalized + "=".repeat(expectedPadding));
  } catch {
    throw new Error("This is not a valid Base64 string. Check its length and padding.");
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("This Base64 value does not contain valid UTF-8 text.");
  }
}

export function Base64Converter() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  let output = "";
  let error = "";

  try {
    output = mode === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Unable to convert this value.";
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setFeedback("");
    setCopied(false);
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setFeedback("Converted value copied.");
      setCopied(true);
    } catch {
      setFeedback("Clipboard access is unavailable. Select the output to copy it.");
      setCopied(false);
    }
  }

  function clearInput() {
    setInput("");
    setFeedback("");
    setCopied(false);
  }

  const inputLabel = mode === "encode" ? "Text to encode" : "Base64 to decode";
  const outputLabel = mode === "encode" ? "Base64 output" : "Decoded text";

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div aria-label="Conversion mode" className="inline-flex rounded-md border border-[var(--line)] bg-[var(--paper)] p-1" role="group">
          {(["encode", "decode"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => changeMode(option)}
              className={`min-h-9 rounded-sm px-4 text-sm font-semibold capitalize transition-colors ${
                mode === option
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {mode === "encode" && (
          <label className="inline-flex min-h-10 items-center gap-2.5 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(event) => {
                setUrlSafe(event.target.checked);
                setFeedback("");
                setCopied(false);
              }}
              className="size-4 accent-[var(--accent-dark)]"
            />
            URL-safe alphabet
          </label>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label
              htmlFor="base64-input"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              {inputLabel}
            </label>
            {input && (
              <button
                type="button"
                onClick={clearInput}
                className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                <X aria-hidden="true" className="size-3.5" />
                Clear
              </button>
            )}
          </div>
          <textarea
            id="base64-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setFeedback("");
              setCopied(false);
            }}
            rows={9}
            aria-invalid={Boolean(error)}
            placeholder={mode === "encode" ? "Enter text to encode..." : "Paste a Base64 string..."}
            className="min-h-56 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)] aria-invalid:border-red-700"
          />
          <p className="mt-2 text-xs text-[var(--muted)]">
            {new TextEncoder().encode(input).length.toLocaleString()} UTF-8 bytes
          </p>
        </div>

        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label
              htmlFor="base64-output"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              {outputLabel}
            </label>
            <button
              type="button"
              onClick={copyOutput}
              disabled={!output || Boolean(error)}
              className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            id="base64-output"
            value={error ? "" : output}
            readOnly
            rows={9}
            placeholder={error || "Converted value will appear here..."}
            className={`min-h-56 w-full resize-y rounded-md border bg-[var(--paper)] px-3.5 py-3 font-mono text-sm leading-6 outline-none placeholder:font-sans ${
              error
                ? "border-red-700 text-red-900 placeholder:text-red-800"
                : "border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted)]"
            }`}
          />
          <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[var(--muted)]">
            {feedback}
          </p>
        </div>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">
        Text is encoded as UTF-8. Base64 is an encoding format, not encryption.
      </p>
    </div>
  );
}