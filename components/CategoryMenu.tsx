"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type CategoryMenuProps = {
  categories: { name: string; slug: string; count: number }[];
};

function closeMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export function CategoryMenu({ categories }: CategoryMenuProps) {
  return (
    <details className="group relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-sm px-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-dark)] [&::-webkit-details-marker]:hidden">
        Categories
        <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-30 mt-2 max-h-[min(70vh,32rem)] w-64 overflow-y-auto rounded-md border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[0_16px_40px_rgb(23_35_29_/_14%)]">
        <Link href="/tools" onClick={closeMenu} className="flex min-h-10 items-center rounded-sm px-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-[var(--accent-dark)]">
          Browse all tools
        </Link>
        <div className="my-1 border-t border-[var(--line)]" />
        {categories.map(({ name, slug, count }) => (
          <Link
            key={name}
            href={`/tools/category/${slug}`}
            onClick={closeMenu}
            className="flex min-h-10 items-center justify-between gap-3 rounded-sm px-3 text-sm text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--accent-dark)]"
          >
            <span>{name}</span>
            <span className="text-xs tabular-nums">{count}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}