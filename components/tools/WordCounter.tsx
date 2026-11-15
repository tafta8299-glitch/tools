"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";

function getWords(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
}

function countSentences(text: string): number {
  const segments = text.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [];
  return segments.filter((segment) => /[\p{L}\p{N}]/u.test(segment)).length;
}

function countParagraphs(text: string): number {
  return text.trim()
    ? text.trim().split(/\n\s*\n/gu).filter((paragraph) => paragraph.trim()).length
    : 0;
}

function formatReadingTime(wordCount: number): string {
  if (wordCount === 0) {
    return "0 min";
  }

  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min`;
}

export function WordCounter() {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const words = getWords(text);
  const stats = [
    { label: "Words", value: words.length.toLocaleString() },
    { label: "Characters", value: Array.from(text).length.toLocaleString() },
    {
      label: "Characters (no spaces)",
      value: Array.from(text.replace(/\s/gu, "")).length.toLocaleString(),
    },
    { label: "Sentences", value: countSentences(text).toLocaleString() },
    { label: "Paragraphs", value: countParagraphs(text).toLocaleString() },
    { label: "Reading time", value: formatReadingTime(words.length) },
  ];

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Text copied to clipboard.");
    } catch {
      setFeedback("Clipboard access is unavailable. Select the text to copy it.");
    }
  }

  function clearText() {
    setText("");
    setFeedback("");
  }

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(15rem,0.7fr)] lg:gap-10">
      <div>
        <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
          <label
            htmlFor="word-counter-text"
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
          id="word-counter-text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setFeedback("");
          }}
          rows={12}
          placeholder="Type or paste your text here..."
          className="min-h-72 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)]"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted)]">
            {Array.from(text).length.toLocaleString()} characters typed
          </p>
          <button
            type="button"
            onClick={copyText}
            disabled={!text}
            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {feedback === "Text copied to clipboard." ? (
              <Check aria-hidden="true" className="size-3.5" />
            ) : (
              <Copy aria-hidden="true" className="size-3.5" />
            )}
            {feedback === "Text copied to clipboard." ? "Copied" : "Copy text"}
          </button>
        </div>
        <p aria-live="polite" className="mt-1 min-h-5 text-xs text-[var(--muted)]">
          {feedback}
        </p>
      </div>

      <aside aria-labelledby="word-stats-heading">
        <h3
          id="word-stats-heading"
          className="mb-1 text-sm font-semibold text-[var(--ink)]"
        >
          Live statistics
        </h3>
        <p className="mb-5 text-xs leading-5 text-[var(--muted)]">
          Updates as you type or paste.
        </p>
        <dl className="grid grid-cols-2 gap-x-5">
          {stats.map((stat) => (
            <div key={stat.label} className="border-t border-[var(--line)] py-4">
              <dt className="text-xs font-medium text-[var(--muted)]">
                {stat.label}
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-[var(--ink)]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
          Reading time is estimated at 200 words per minute.
        </p>
      </aside>
    </div>
  );
}