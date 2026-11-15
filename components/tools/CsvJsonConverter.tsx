"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Check, Copy, X } from "lucide-react";

type Direction = "csv-to-json" | "json-to-csv";

export function CsvJsonConverter() {
  const [direction, setDirection] = useState<Direction>("csv-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState(2);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputLabel = direction === "csv-to-json" ? "CSV input" : "JSON input";
  const outputLabel = direction === "csv-to-json" ? "JSON output" : "CSV output";

  function convert() {
    setCopied(false);

    if (!input.trim()) {
      setOutput("");
      setFeedback(`Enter ${direction === "csv-to-json" ? "CSV" : "JSON"} data to convert.`);
      setIsError(true);
      return;
    }

    try {
      if (direction === "csv-to-json") {
        const parsed = Papa.parse<Record<string, string>>(input, {
          header: true,
          skipEmptyLines: "greedy",
          transformHeader: (header) => header.trim(),
        });

        if (parsed.errors.length > 0) {
          throw new Error(`CSV error on row ${(parsed.errors[0].row ?? 0) + 1}: ${parsed.errors[0].message}`);
        }
        if (!parsed.meta.fields?.length) {
          throw new Error("CSV needs a header row with at least one column name.");
        }

        setOutput(JSON.stringify(parsed.data, null, indent));
      } else {
        const parsed: unknown = JSON.parse(input);
        if (
          !Array.isArray(parsed) ||
          parsed.some((row) => row === null || typeof row !== "object" || Array.isArray(row))
        ) {
          throw new Error("Provide a JSON array of objects, such as [{\"name\":\"Ada\"}].");
        }

        setOutput(Papa.unparse(parsed as Record<string, unknown>[], { escapeFormulae: true }));
      }

      setFeedback("Conversion complete.");
      setIsError(false);
    } catch (error) {
      setOutput("");
      setFeedback(error instanceof Error ? error.message : "Unable to convert this data.");
      setIsError(true);
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setFeedback(`${outputLabel} copied to clipboard.`);
      setCopied(true);
      setIsError(false);
    } catch {
      setFeedback("Clipboard access is unavailable. Select the output to copy it.");
      setCopied(false);
      setIsError(false);
    }
  }

  function changeDirection(nextDirection: Direction) {
    setDirection(nextDirection);
    setInput("");
    setOutput("");
    setFeedback("");
    setIsError(false);
    setCopied(false);
  }

  function clear() {
    setInput("");
    setOutput("");
    setFeedback("");
    setIsError(false);
    setCopied(false);
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-md border border-[var(--line)] bg-[var(--paper)] p-1" role="group" aria-label="Conversion direction">
          {(["csv-to-json", "json-to-csv"] as const).map((option) => (
            <button key={option} type="button" aria-pressed={direction === option} onClick={() => changeDirection(option)} className={`min-h-9 rounded-sm px-3 text-sm font-semibold transition-colors ${direction === option ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
              {option === "csv-to-json" ? "CSV → JSON" : "JSON → CSV"}
            </button>
          ))}
        </div>
        {direction === "csv-to-json" && (
          <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
            JSON indent
            <select value={indent} onChange={(event) => setIndent(Number(event.target.value))} className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </label>
        )}
        {input && <button type="button" onClick={clear} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"><X aria-hidden="true" className="size-3.5" />Clear</button>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="csv-json-input" className="mb-2 block text-sm font-semibold text-[var(--ink)]">{inputLabel}</label>
          <textarea id="csv-json-input" value={input} onChange={(event) => { setInput(event.target.value); setOutput(""); setFeedback(""); setIsError(false); setCopied(false); }} rows={12} spellCheck={false} placeholder={direction === "csv-to-json" ? "name,role\nAda,Engineer" : '[{"name":"Ada","role":"Engineer"}]'} className="min-h-72 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] placeholder:font-sans placeholder:text-[var(--muted)]" />
          <button type="button" onClick={convert} disabled={!input.trim()} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45">Convert to {direction === "csv-to-json" ? "JSON" : "CSV"}</button>
        </div>
        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label htmlFor="csv-json-output" className="text-sm font-semibold text-[var(--ink)]">{outputLabel}</label>
            <button type="button" onClick={copyOutput} disabled={!output} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45">{copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}{copied ? "Copied" : "Copy"}</button>
          </div>
          <textarea id="csv-json-output" value={output} readOnly rows={12} placeholder={`${outputLabel} will appear here...`} className="min-h-72 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--paper)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none placeholder:font-sans placeholder:text-[var(--muted)]" />
          <p aria-live="polite" className={`mt-2 min-h-5 text-xs ${isError ? "text-red-800" : "text-[var(--muted)]"}`}>{feedback}</p>
        </div>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">CSV parsing honors quoted commas and line breaks. Data is converted locally in your browser.</p>
    </div>
  );
}