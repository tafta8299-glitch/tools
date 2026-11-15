"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";

type Mode = "encode" | "decode";
type Scope = "component" | "url";

export function UrlEncoderDecoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [scope, setScope] = useState<Scope>("component");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  let output = "";
  let error = "";

  try {
    output = mode === "encode"
      ? scope === "component"
        ? encodeURIComponent(input)
        : encodeURI(input)
      : decodeURIComponent(input);
  } catch {
    error = "This value contains an invalid percent-encoded sequence.";
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setFeedback("");
    setCopied(false);
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setFeedback("Converted URL copied.");
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

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-md border border-[var(--line)] bg-[var(--paper)] p-1" role="group" aria-label="Conversion mode">
          {(["encode", "decode"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => changeMode(option)}
              className={`min-h-9 rounded-sm px-4 text-sm font-semibold capitalize transition-colors ${mode === option ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
            >
              {option}
            </button>
          ))}
        </div>
        {mode === "encode" && (
          <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
            Encoding
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as Scope)}
              className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]"
            >
              <option value="component">URL component</option>
              <option value="url">Full URL</option>
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label htmlFor="url-input" className="text-sm font-semibold text-[var(--ink)]">
              {mode === "encode" ? "Text or URL to encode" : "URL-encoded text"}
            </label>
            {input && (
              <button type="button" onClick={clearInput} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
                <X aria-hidden="true" className="size-3.5" />
                Clear
              </button>
            )}
          </div>
          <textarea
            id="url-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setFeedback("");
              setCopied(false);
            }}
            rows={9}
            spellCheck={false}
            aria-invalid={Boolean(error)}
            placeholder={mode === "encode" ? "https://example.com/search?q=hello world" : "Paste encoded text here..."}
            className="min-h-56 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)] aria-invalid:border-red-700"
          />
        </div>

        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label htmlFor="url-output" className="text-sm font-semibold text-[var(--ink)]">
              {mode === "encode" ? "Encoded output" : "Decoded output"}
            </label>
            <button type="button" onClick={copyOutput} disabled={!output || Boolean(error)} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45">
              {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            id="url-output"
            value={error ? "" : output}
            readOnly
            rows={9}
            placeholder={error || "Converted value will appear here..."}
            className={`min-h-56 w-full resize-y rounded-md border bg-[var(--paper)] px-3.5 py-3 font-mono text-sm leading-6 outline-none placeholder:font-sans ${error ? "border-red-700 text-red-900 placeholder:text-red-800" : "border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted)]"}`}
          />
          <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[var(--muted)]">{feedback}</p>
        </div>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">
        URL component encoding escapes reserved characters; full URL encoding preserves URL separators.
      </p>
    </div>
  );
}