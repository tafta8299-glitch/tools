import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/data/tools";
import { ToolIcon } from "@/components/ToolIcon";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="group flex min-h-56 flex-col rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-dark)]/40 hover:shadow-[0_12px_30px_rgb(23_35_29_/_8%)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-[var(--accent)]/50 text-[var(--accent-dark)] transition-colors group-hover:bg-[var(--accent)]">
          <ToolIcon name={tool.icon} className="size-5" />
        </span>
        <span className="pt-1 text-xs font-medium text-[var(--muted)]">
          {tool.category}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold leading-snug text-[var(--ink)]">
        {tool.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">
        {tool.shortDescription}
      </p>
      <Link
        href={`/tools/${tool.slug}`}
        className="mt-5 inline-flex min-h-10 items-center justify-between border-t border-[var(--line)] pt-3 text-sm font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--accent-dark)]"
      >
        Use {tool.name}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}