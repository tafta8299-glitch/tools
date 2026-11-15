"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 shadow-[0_8px_24px_rgb(23_35_29_/_6%)] transition-shadow focus-within:border-[var(--accent-dark)] focus-within:shadow-[0_8px_28px_rgb(23_35_29_/_10%)]">
      <Search aria-hidden="true" className="size-5 shrink-0 text-[var(--muted)]" />
      <label className="sr-only" htmlFor="tool-search">
        Search tools by name or description
      </label>
      <input
        id="tool-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="What do you need to do?"
        className="h-full min-w-0 flex-1 bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="grid size-8 shrink-0 place-items-center rounded-sm text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}