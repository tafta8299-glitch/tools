"use client";

import { useState } from "react";
import Link from "next/link";
import type { Tool } from "@/data/tools";
import {
  getCategoryId,
  getCategoryLinkLabel,
  getCategorySlug,
  getToolSubcategory,
} from "@/data/tools";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";

export function CategoryDirectory({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredTools = normalizedQuery
    ? tools.filter((tool) =>
        `${tool.name} ${tool.shortDescription} ${tool.longDescription} ${tool.category} ${getToolSubcategory(tool)}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : tools;
  const grouped = new Map<string, Map<string, Tool[]>>();

  for (const tool of filteredTools) {
    const subcategory = getToolSubcategory(tool);
    const subcategories = grouped.get(tool.category) ?? new Map<string, Tool[]>();
    const subcategoryTools = subcategories.get(subcategory) ?? [];
    subcategoryTools.push(tool);
    subcategories.set(subcategory, subcategoryTools);
    grouped.set(tool.category, subcategories);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Browse categories</h2>
        <nav aria-label="Tool categories" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {[...new Set(filteredTools.map((tool) => tool.category))].map((category) => (
            <Link
              key={category}
              href={`/tools/category/${getCategorySlug(category)}`}
              className="inline-flex min-h-10 shrink-0 items-center justify-between gap-4 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-dark)] lg:border-transparent lg:bg-transparent"
            >
              <span>{getCategoryLinkLabel(category)}</span>
              <span className="text-xs tabular-nums text-[var(--muted)]">
                {filteredTools.filter((tool) => tool.category === category).length}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <SearchBar value={query} onChange={setQuery} />
        <p aria-live="polite" className="mb-6 mt-3 text-sm text-[var(--muted)]">
          {normalizedQuery
            ? `${filteredTools.length} ${filteredTools.length === 1 ? "tool" : "tools"} found`
            : `${filteredTools.length} tools across ${grouped.size} categories`}
        </p>

        {grouped.size ? (
          <div>
            {[...grouped].map(([category, subcategories]) => (
              <section key={category} id={getCategoryId(category)} aria-labelledby={`${getCategoryId(category)}-heading`} className="scroll-mt-8 border-t border-[var(--line)] py-8 first:border-t-0 first:pt-2">
                <div className="mb-6 flex items-baseline justify-between gap-4">
                  <h2 id={`${getCategoryId(category)}-heading`} className="text-2xl font-semibold text-[var(--ink)]">{category}</h2>
                  <span className="text-xs text-[var(--muted)]">{[...subcategories.values()].flat().length} tools</span>
                </div>
                <div className="space-y-8">
                  {[...subcategories].map(([subcategory, subcategoryTools]) => (
                    <section key={subcategory} aria-labelledby={`${getCategoryId(category)}-${getCategoryId(subcategory)}-heading`}>
                      <div className="mb-3 flex items-center gap-3">
                        <h3 id={`${getCategoryId(category)}-${getCategoryId(subcategory)}-heading`} className="text-sm font-semibold text-[var(--accent-dark)]">{subcategory}</h3>
                        <span aria-hidden="true" className="h-px flex-1 bg-[var(--line)]" />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {subcategoryTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="border-t border-[var(--line)] py-12 text-center">
            <h2 className="text-lg font-semibold text-[var(--ink)]">No tools found</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Try a different search.</p>
            <button type="button" onClick={() => setQuery("")} className="mt-4 min-h-10 text-sm font-semibold text-[var(--accent-dark)] underline underline-offset-4">
              Show all tools
            </button>
          </div>
        )}
      </div>
    </div>
  );
}