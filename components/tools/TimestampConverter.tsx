"use client";

import { useState } from "react";
import { ArrowLeftRight, Copy, Check } from "lucide-react";

type Direction = "date-to-timestamp" | "timestamp-to-date";
type TimestampUnit = "seconds" | "milliseconds";

export function TimestampConverter() {
  const [direction, setDirection] = useState<Direction>("date-to-timestamp");
  const [unit, setUnit] = useState<TimestampUnit>("seconds");
  const [dateInput, setDateInput] = useState("");
  const [timestampInput, setTimestampInput] = useState("");
  const [result, setResult] = useState<{ label: string; value: string }[]>([]);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState("");

  function convert() {
    const milliseconds = direction === "date-to-timestamp"
      ? new Date(dateInput).getTime()
      : Number(timestampInput) * (unit === "seconds" ? 1000 : 1);

    if (
      (direction === "date-to-timestamp" && !dateInput) ||
      (direction === "timestamp-to-date" && !timestampInput.trim()) ||
      !Number.isFinite(milliseconds) ||
      Math.abs(milliseconds) > 8.64e15
    ) {
      setResult([]);
      setFeedback(direction === "date-to-timestamp" ? "Enter a valid date and time." : "Enter a valid timestamp.");
      return;
    }

    const date = new Date(milliseconds);
    const seconds = Math.floor(milliseconds / 1000);
    setResult(direction === "date-to-timestamp"
      ? [
          { label: "Unix seconds", value: String(seconds) },
          { label: "Unix milliseconds", value: String(milliseconds) },
          { label: "UTC", value: date.toISOString() },
        ]
      : [
          { label: "UTC", value: date.toISOString() },
          { label: "Local time", value: date.toLocaleString() },
          { label: "Unix milliseconds", value: String(milliseconds) },
        ]);
    setFeedback("");
    setCopied("");
  }

  function swapDirection() {
    setDirection((current) => current === "date-to-timestamp" ? "timestamp-to-date" : "date-to-timestamp");
    setResult([]);
    setFeedback("");
    setCopied("");
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setFeedback(`${label} copied.`);
    } catch {
      setCopied("");
      setFeedback("Clipboard access is unavailable.");
    }
  }

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {direction === "date-to-timestamp" ? "Date and time to timestamp" : "Timestamp to date and time"}
          </p>
          <button type="button" onClick={swapDirection} title="Swap conversion direction" aria-label="Swap conversion direction" className="grid size-9 shrink-0 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]">
            <ArrowLeftRight aria-hidden="true" className="size-4" />
          </button>
        </div>

        {direction === "date-to-timestamp" ? (
          <div>
            <label htmlFor="timestamp-date" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Local date and time</label>
            <input id="timestamp-date" type="datetime-local" value={dateInput} onChange={(event) => setDateInput(event.target.value)} className="h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">The selected date is interpreted in your current time zone.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="unix-timestamp" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Unix timestamp</label>
              <input id="unix-timestamp" type="number" step="any" value={timestampInput} onChange={(event) => setTimestampInput(event.target.value)} placeholder="e.g. 1735689600" className="h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
              Timestamp unit
              <select value={unit} onChange={(event) => setUnit(event.target.value as TimestampUnit)} className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
                <option value="seconds">Seconds</option>
                <option value="milliseconds">Milliseconds</option>
              </select>
            </label>
          </div>
        )}

        <button type="button" onClick={convert} className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]">
          Convert
        </button>
        <p aria-live="polite" className="min-h-5 text-xs text-red-800">{feedback}</p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">Conversion results</h3>
        {result.length ? (
          <dl className="divide-y divide-[var(--line)] rounded-md border border-[var(--line)] bg-[var(--surface)] px-4">
            {result.map(({ label, value }) => (
              <div key={label} className="flex min-h-16 items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-[var(--muted)]">{label}</dt>
                  <dd className="mt-1 break-all font-mono text-sm text-[var(--ink)]">{value}</dd>
                </div>
                <button type="button" onClick={() => copyValue(label, value)} aria-label={`Copy ${label}`} title={`Copy ${label}`} className="grid size-9 shrink-0 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]">
                  {copied === label ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                </button>
              </div>
            ))}
          </dl>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-md border border-dashed border-[var(--line)] bg-[var(--paper)] px-6 text-center text-sm text-[var(--muted)]">Converted values will appear here.</div>
        )}
      </div>
    </div>
  );
}