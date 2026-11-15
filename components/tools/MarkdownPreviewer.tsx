"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Eye, X } from "lucide-react";

const starterMarkdown = `# A quick note\n\nWrite **Markdown** on the left and preview it here.\n\n- Lists and links\n- Tables and task lists\n\n| Item | Status |\n| --- | --- |\n| Preview | Ready |`;

export function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState(starterMarkdown);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setFeedback("Markdown copied to clipboard.");
    } catch {
      setCopied(false);
      setFeedback("Clipboard access is unavailable.");
    }
  }

  function clearMarkdown() {
    setMarkdown("");
    setFeedback("");
    setCopied(false);
  }

  return (
    <div className="space-y-5 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">GitHub Flavored Markdown supported</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={copyMarkdown} disabled={!markdown} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--ink)] disabled:opacity-45">
            {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
            {copied ? "Copied" : "Copy Markdown"}
          </button>
          <button type="button" onClick={clearMarkdown} disabled={!markdown} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-45">
            <X aria-hidden="true" className="size-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="markdown-source" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Markdown</label>
          <textarea id="markdown-source" value={markdown} onChange={(event) => { setMarkdown(event.target.value); setFeedback(""); setCopied(false); }} rows={16} spellCheck={false} placeholder="Write Markdown here..." className="min-h-[28rem] w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] placeholder:font-sans placeholder:text-[var(--muted)]" />
        </div>
        <section aria-labelledby="markdown-preview-heading">
          <h3 id="markdown-preview-heading" className="mb-2 flex min-h-8 items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Eye aria-hidden="true" className="size-4" />
            Preview
          </h3>
          <div className="min-h-[28rem] overflow-auto rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-7 text-[var(--ink)] [&_a]:text-[var(--accent-dark)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--line)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[var(--paper)] [&_code]:px-1 [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-5 [&_hr]:border-[var(--line)] [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--paper)] [&_pre]:p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--line)] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[var(--line)] [&_th]:bg-[var(--paper)] [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc">
            {markdown ? <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown> : <p className="text-[var(--muted)]">Preview will appear here.</p>}
          </div>
          <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[var(--muted)]">{feedback}</p>
        </section>
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">Raw HTML is not enabled in the preview.</p>
    </div>
  );
}