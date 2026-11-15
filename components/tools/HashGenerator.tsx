"use client";

import { useState } from "react";
import { Check, Copy, Hash } from "lucide-react";

const algorithms = ["SHA-256", "SHA-384", "SHA-512"] as const;
type Algorithm = (typeof algorithms)[number];

export function HashGenerator() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  const [digest, setDigest] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateHash() {
    setFeedback("");
    setCopied(false);

    if (!globalThis.crypto?.subtle) {
      setDigest("");
      setFeedback("Hashing isn't available here. Open this page over https or try another browser.");
      return;
    }

    setIsWorking(true);
    try {
      const bytes = new TextEncoder().encode(input);
      const result = await crypto.subtle.digest(algorithm, bytes);
      setDigest(Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join(""));
    } catch {
      setDigest("");
      setFeedback("Unable to generate a hash for this input.");
    } finally {
      setIsWorking(false);
    }
  }

  async function copyDigest() {
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setFeedback("Hash copied to clipboard.");
    } catch {
      setCopied(false);
      setFeedback("Clipboard access is unavailable. Select the hash to copy it.");
    }
  }

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
      <div className="space-y-5">
        <div>
          <label htmlFor="hash-algorithm" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Hash algorithm</label>
          <select id="hash-algorithm" value={algorithm} onChange={(event) => { setAlgorithm(event.target.value as Algorithm); setDigest(""); setFeedback(""); setCopied(false); }} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
            {algorithms.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hash-input" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Text to hash</label>
          <textarea id="hash-input" value={input} onChange={(event) => { setInput(event.target.value); setDigest(""); setFeedback(""); setCopied(false); }} rows={7} placeholder="Enter or paste text..." className="min-h-44 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] placeholder:text-[var(--muted)]" />
        </div>
        <button type="button" onClick={generateHash} disabled={isWorking} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-wait disabled:opacity-60">
          <Hash aria-hidden="true" className="size-4" />
          {isWorking ? "Generating..." : "Generate hash"}
        </button>
      </div>

      <div>
        <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">{algorithm} digest</h3>
          <button type="button" onClick={copyDigest} disabled={!digest} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45">
            {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <output aria-label="Generated hash" className="block min-h-36 break-all rounded-md border border-[var(--line)] bg-[var(--paper)] p-4 font-mono text-sm leading-6 text-[var(--ink)]">
          {digest || <span className="font-sans text-[var(--muted)]">The hash will appear here.</span>}
        </output>
        <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[var(--muted)]">{feedback}</p>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Your text never leaves your device. A hash can&apos;t be turned back into the original text.</p>
      </div>
    </div>
  );
}