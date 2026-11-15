"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

function createUuidV4(): string {
  if (typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function UuidGenerator() {
  const [quantityInput, setQuantityInput] = useState("5");
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedUuid, setCopiedUuid] = useState("");
  const [feedback, setFeedback] = useState("");
  const quantity = Number(quantityInput);
  const canGenerate = Number.isInteger(quantity) && quantity >= 1 && quantity <= 100;

  function generateBatch() {
    if (!canGenerate) {
      return;
    }

    try {
      setUuids(Array.from({ length: quantity }, createUuidV4));
      setCopiedUuid("");
      setFeedback("");
    } catch {
      setUuids([]);
      setFeedback("Secure random generation is unavailable in this browser.");
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedUuid(label);
      setFeedback(label === "all" ? "UUIDs copied to clipboard." : "UUID copied to clipboard.");
    } catch {
      setCopiedUuid("");
      setFeedback("Clipboard access is unavailable. Select the UUIDs to copy them.");
    }
  }

  function clearBatch() {
    setUuids([]);
    setCopiedUuid("");
    setFeedback("");
  }

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-10">
      <div className="space-y-6">
        <div>
          <label
            htmlFor="uuid-quantity"
            className="mb-2 block text-sm font-semibold text-[var(--ink)]"
          >
            Number of UUIDs
          </label>
          <input
            id="uuid-quantity"
            type="number"
            min={1}
            max={100}
            step={1}
            value={quantityInput}
            onChange={(event) => setQuantityInput(event.target.value)}
            aria-describedby="uuid-quantity-hint"
            aria-invalid={!canGenerate}
            className="h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] aria-invalid:border-red-700"
          />
          <p
            id="uuid-quantity-hint"
            className={`mt-2 text-xs ${canGenerate ? "text-[var(--muted)]" : "text-red-800"}`}
          >
            Choose an integer from 1 to 100.
          </p>
        </div>

        <button
          type="button"
          onClick={generateBatch}
          disabled={!canGenerate}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Generate {canGenerate ? quantity : ""} {quantity === 1 ? "UUID" : "UUIDs"}
        </button>

        <p className="text-xs leading-5 text-[var(--muted)]">
          UUIDs use version 4 and are generated locally with the browser&apos;s secure random number generator.
        </p>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Generated UUIDs
            {uuids.length > 0 && (
              <span className="ml-2 font-normal text-[var(--muted)]">
                {uuids.length.toLocaleString()}
              </span>
            )}
          </h3>
          {uuids.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => copyValue(uuids.join("\n"), "all")}
                className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--ink)]"
              >
                {copiedUuid === "all" ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : (
                  <Copy aria-hidden="true" className="size-3.5" />
                )}
                {copiedUuid === "all" ? "Copied all" : "Copy all"}
              </button>
              <button
                type="button"
                onClick={clearBatch}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {uuids.length > 0 ? (
          <ol className="max-h-96 divide-y divide-[var(--line)] overflow-y-auto rounded-md border border-[var(--line)] bg-[var(--surface)]">
            {uuids.map((uuid) => (
              <li key={uuid} className="flex min-h-12 items-center gap-3 px-3 py-2 sm:px-4">
                <code className="min-w-0 flex-1 break-all font-mono text-sm text-[var(--ink)]">
                  {uuid}
                </code>
                <button
                  type="button"
                  onClick={() => copyValue(uuid, uuid)}
                  aria-label={`Copy UUID ${uuid}`}
                  title="Copy UUID"
                  className="grid size-9 shrink-0 place-items-center rounded-sm text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                >
                  {copiedUuid === uuid ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Copy aria-hidden="true" className="size-4" />
                  )}
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-md border border-dashed border-[var(--line)] bg-[var(--paper)] px-6 text-center text-sm text-[var(--muted)]">
            Your generated UUIDs will appear here.
          </div>
        )}

        <p aria-live="polite" className="mt-3 min-h-5 text-xs text-[var(--muted)]">
          {feedback}
        </p>
      </div>
    </div>
  );
}