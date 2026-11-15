"use client";

import { useState } from "react";
import Link from "next/link";
import type { Tool } from "@/data/tools";
import { getCategoryLinkLabel, getCategorySlug } from "@/data/tools";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";

type ToolsDirectoryProps = {
  tools: Tool[];
};

export function ToolsDirectory({ tools }: ToolsDirectoryProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredTools = normalizedQuery
    ? tools.filter((tool) =>
        `${tool.name} ${tool.shortDescription} ${tool.longDescription} ${tool.category}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : tools;
  const categories = [...new Set(tools.map((tool) => tool.category))];

  return (
    <div>
      <nav aria-label="Browse tools by category" className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--line)] pb-5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Categories
        </span>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/tools/category/${getCategorySlug(category)}`}
            className="text-sm font-medium text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/35 underline-offset-4 hover:decoration-[var(--accent-dark)]"
          >
            {getCategoryLinkLabel(category)}
          </Link>
        ))}
      </nav>
      <SearchBar value={query} onChange={setQuery} />
      <div className="mb-5 flex min-h-6 items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {normalizedQuery
            ? `${filteredTools.length} ${filteredTools.length === 1 ? "tool" : "tools"} found`
            : `${filteredTools.length} tools to make life a little easier`}
        </p>
        {normalizedQuery && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-sm font-semibold text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/40 underline-offset-4 hover:decoration-[var(--accent-dark)]"
          >
            Clear search
          </button>
        )}
      </div>
      {filteredTools.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-[var(--ink)]">No tools found</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Try another name or description.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-5 text-sm font-semibold text-[var(--accent-dark)] underline underline-offset-4"
          >
            Show all tools
          </button>
        </div>
      )}
    </div>
  );
}