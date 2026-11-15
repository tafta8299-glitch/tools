"use client";

import { useState } from "react";
import { Check, Copy, GitCompareArrows, X } from "lucide-react";
import { diffLines, type Change } from "diff";

type DiffLine = { kind: "added" | "removed" | "unchanged"; text: string };

function toLines(value: string): string[] {
  const lines = value.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines.map((line) => line.replace(/\r$/u, ""));
}

function makeDiffLines(changes: Change[]): DiffLine[] {
  return changes.flatMap((change) =>
    toLines(change.value).map((text) => ({
      kind: change.added ? "added" : change.removed ? "removed" : "unchanged",
      text,
    })),
  );
}

function countChangedLines(changes: Change[], property: "added" | "removed"): number {
  return changes
    .filter((change) => change[property])
    .reduce((total, change) => total + toLines(change.value).length, 0);
}

export function TextDiffChecker() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [lines, setLines] = useState<DiffLine[] | null>(null);
  const [summary, setSummary] = useState({ added: 0, removed: 0 });
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");

  function compare() {
    const changes = diffLines(original, modified);
    setLines(makeDiffLines(changes));
    setSummary({
      added: countChangedLines(changes, "added"),
      removed: countChangedLines(changes, "removed"),
    });
    setCopied(false);
    setFeedback("");
  }

  function clear() {
    setOriginal("");
    setModified("");
    setLines(null);
    setSummary({ added: 0, removed: 0 });
    setCopied(false);
    setFeedback("");
  }

  async function copyDiff() {
    const text = (lines ?? [])
      .map(({ kind, text: line }) => `${kind === "added" ? "+" : kind === "removed" ? "-" : " "}${line}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFeedback("Diff copied to clipboard.");
    } catch {
      setCopied(false);
      setFeedback("Clipboard access is unavailable.");
    }
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="diff-original" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Original text</label>
          <textarea id="diff-original" value={original} onChange={(event) => setOriginal(event.target.value)} rows={8} placeholder="Paste the original text..." className="min-h-48 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] placeholder:font-sans placeholder:text-[var(--muted)]" />
        </div>
        <div>
          <label htmlFor="diff-modified" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Modified text</label>
          <textarea id="diff-modified" value={modified} onChange={(event) => setModified(event.target.value)} rows={8} placeholder="Paste the changed text..." className="min-h-48 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] placeholder:font-sans placeholder:text-[var(--muted)]" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={compare} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]">
          <GitCompareArrows aria-hidden="true" className="size-4" />
          Compare text
        </button>
        {(original || modified || lines) && (
          <button type="button" onClick={clear} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
            <X aria-hidden="true" className="size-4" />
            Clear
          </button>
        )}
        {lines && (
          <span className="ml-auto flex flex-wrap gap-4 text-xs font-medium">
            <span className="text-green-800">+{summary.added} added</span>
            <span className="text-red-800">−{summary.removed} removed</span>
          </span>
        )}
      </div>

      {lines && (
        <section aria-label="Line-by-line differences" className="overflow-hidden rounded-md border border-[var(--line)]">
          <div className="flex min-h-11 items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Line differences</h3>
            <button type="button" onClick={copyDiff} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--ink)]">
              {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
              {copied ? "Copied" : "Copy diff"}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto bg-[var(--surface)] py-2 font-mono text-xs leading-6 sm:text-sm">
            {lines.length ? lines.map((line, index) => (
              <div key={`${index}-${line.kind}`} className={`flex min-h-6 px-3 ${line.kind === "added" ? "bg-green-100 text-green-950" : line.kind === "removed" ? "bg-red-100 text-red-950" : "text-[var(--muted)]"}`}>
                <span aria-hidden="true" className="w-5 shrink-0 select-none">{line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}</span>
                <span className="whitespace-pre-wrap break-all">{line.text || " "}</span>
              </div>
            )) : <p className="px-4 py-3 text-sm text-[var(--muted)]">The texts are identical.</p>}
          </pre>
          <p aria-live="polite" className="min-h-5 px-4 py-1 text-xs text-[var(--muted)]">{feedback}</p>
        </section>
      )}
    </div>
  );
}