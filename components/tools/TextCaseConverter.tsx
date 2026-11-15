"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";

const modes = [
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "sentence", label: "Sentence case" },
  { value: "title", label: "Title Case" },
  { value: "camel", label: "camelCase" },
  { value: "pascal", label: "PascalCase" },
  { value: "snake", label: "snake_case" },
  { value: "kebab", label: "kebab-case" },
] as const;

type CaseMode = (typeof modes)[number]["value"];

function getWords(text: string): string[] {
  const normalized = text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

  return (normalized.match(/[\p{L}\p{N}]+/gu) ?? []).map((word) =>
    word.toLocaleLowerCase(),
  );
}

function capitalize(word: string): string {
  const [firstCharacter, ...rest] = Array.from(word);
  return `${firstCharacter?.toLocaleUpperCase() ?? ""}${rest.join("")}`;
}

function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "uppercase":
      return text.toLocaleUpperCase();
    case "lowercase":
      return text.toLocaleLowerCase();
    case "sentence":
      return text
        .toLocaleLowerCase()
        .replace(/(^|[.!?]\s*)([\p{L}])/gu, (_, boundary: string, letter: string) =>
          `${boundary}${letter.toLocaleUpperCase()}`,
        );
    case "title":
      return text
        .toLocaleLowerCase()
        .replace(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu, capitalize);
    case "camel": {
      const [firstWord, ...rest] = getWords(text);
      return `${firstWord ?? ""}${rest.map(capitalize).join("")}`;
    }
    case "pascal":
      return getWords(text).map(capitalize).join("");
    case "snake":
      return getWords(text).join("_");
    case "kebab":
      return getWords(text).join("-");
  }
}

export function TextCaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("sentence");
  const [feedback, setFeedback] = useState("");
  const output = convertCase(text, mode);
  const wordCount = getWords(text).length;
  const characterCount = Array.from(text).length;

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setFeedback("Converted text copied.");
    } catch {
      setFeedback("Clipboard access is unavailable. Select the output to copy it.");
    }
  }

  function clearText() {
    setText("");
    setFeedback("");
  }

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">
          Convert to
        </h3>
        <div
          aria-label="Text case"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="group"
        >
          {modes.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => {
                setMode(option.value);
                setFeedback("");
              }}
              className={`min-h-10 rounded-md border px-3 text-sm font-medium transition-colors ${
                mode === option.value
                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent-dark)] hover:text-[var(--ink)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label
              htmlFor="case-input"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              Your text
            </label>
            {text && (
              <button
                type="button"
                onClick={clearText}
                className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                <X aria-hidden="true" className="size-3.5" />
                Clear
              </button>
            )}
          </div>
          <textarea
            id="case-input"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setFeedback("");
            }}
            rows={9}
            placeholder="Type or paste your text here..."
            className="min-h-56 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)]"
          />
          <p className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{characterCount.toLocaleString()} characters</span>
          </p>
        </div>

        <div>
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <label
              htmlFor="case-output"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              Converted text
            </label>
            <button
              type="button"
              onClick={copyOutput}
              disabled={!output}
              className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {feedback === "Converted text copied." ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                <Copy aria-hidden="true" className="size-3.5" />
              )}
              {feedback === "Converted text copied." ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            id="case-output"
            value={output}
            readOnly
            rows={9}
            placeholder="Your converted text will appear here..."
            className="min-h-56 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--paper)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          />
          <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[var(--muted)]">
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
}