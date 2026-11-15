"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";

type FormatMode = "format" | "minify";

function getParseErrorMessage(error: unknown, input: string): string {
  if (!(error instanceof SyntaxError)) {
    return "Unable to parse this JSON.";
  }

  const position = error.message.match(/position\s+(\d+)/iu)?.[1];
  if (!position) {
    return `Invalid JSON: ${error.message}`;
  }

  const offset = Number(position);
  const precedingText = input.slice(0, offset);
  const line = precedingText.split("\n").length;
  const lastLineBreak = precedingText.lastIndexOf("\n");
  const column = offset - lastLineBreak;

  return `Invalid JSON near line ${line}, column ${column}. ${error.message}`;
}

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState(2);
  const [mode, setMode] = useState<FormatMode>("format");
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState(false);

  function convert(nextMode: FormatMode = mode) {
    if (!input.trim()) {
      setOutput("");
      setFeedback("Enter JSON to format or minify.");
      setIsError(true);
      setCopied(false);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(input);
      const converted =
        nextMode === "format"
          ? JSON.stringify(parsed, null, indent)
          : JSON.stringify(parsed);

      setOutput(converted ?? "");
      setMode(nextMode);
      setFeedback(nextMode === "format" ? "Valid JSON formatted." : "Valid JSON minified.");
      setIsError(false);
      setCopied(false);
    } catch (error) {
      setOutput("");
      setFeedback(getParseErrorMessage(error, input));
      setIsError(true);
      setCopied(false);
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setFeedback("JSON copied to clipboard.");
      setCopied(true);
      setIsError(false);
    } catch {
      setFeedback("Clipboard access is unavailable. Select the output to copy it.");
      setCopied(false);
      setIsError(false);
    }
  }

  function clearInput() {
    setInput("");
    setOutput("");
    setFeedback("");
    setIsError(false);
    setCopied(false);
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border border-[var(--line)] bg-[var(--paper)] p-1">
            {(["format", "minify"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={`min-h-9 rounded-sm px-3 text-sm font-semibold capitalize transition-colors ${
                  mode === option
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {option === "format" ? "Format" : "Minify"}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
            Indent
            <select
              value={indent}
              onChange={(event) => setIndent(Number(event.target.value))}
              className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </label>
        </div>
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

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label
            htmlFor="json-input"
            className="mb-2 block text-sm font-semibold text-[var(--ink)]"
          >
            JSON input
          </label>
          <textarea
            id="json-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput("");
              setFeedback("");
              setIsError(false);
              setCopied(false);
            }}
            rows={12}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            placeholder={'Paste JSON here, for example:\n{"name":"Toolbox","active":true}'}
            className="min-h-72 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)]"
          />
          <button
            type="button"
            onClick={() => convert()}
            disabled={!input.trim()}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mode === "format" ? "Format JSON" : "Minify JSON"}
          </button>
        </div>

        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label
              htmlFor="json-output"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              Output
            </label>
            <button
              type="button"
              onClick={copyOutput}
              disabled={!output || isError}
              className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            id="json-output"
            value={output}
            readOnly
            rows={12}
            placeholder="Formatted JSON will appear here..."
            className="min-h-72 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--paper)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none placeholder:font-sans placeholder:text-[var(--muted)]"
          />
          <p
            aria-live="polite"
            className={`mt-2 min-h-5 text-xs ${isError ? "text-red-800" : "text-[var(--muted)]"}`}
          >
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
}