"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { pals, type Pal } from "@/data/palworld-pals";
import { ElementBadges } from "./ElementBadges";

const palsByName = [...pals].sort((a, b) => a.name.localeCompare(b.name));

function matchingPals(query: string): Pal[] {
  const text = query.trim().toLocaleLowerCase();
  if (!text) return palsByName;

  const ranked: { pal: Pal; rank: number }[] = [];
  for (const pal of palsByName) {
    const name = pal.name.toLocaleLowerCase();
    const rank = name.startsWith(text)
      ? 0
      : name.includes(text)
        ? 1
        : pal.elements.some((element) => element.toLocaleLowerCase().startsWith(text))
          ? 2
          : -1;
    if (rank >= 0) ranked.push({ pal, rank });
  }

  return ranked.sort((a, b) => a.rank - b.rank).map(({ pal }) => pal);
}

/** Searchable dropdown for choosing one Pal. */
export function PalPicker({
  label,
  value,
  onChange,
  placeholder = "Search for a Pal",
}: {
  label: string;
  value: Pal | null;
  onChange: (pal: Pal | null) => void;
  placeholder?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // While the box still shows the chosen Pal's name, list every Pal.
  const options = open && query !== value?.name ? matchingPals(query) : palsByName;
  const active = Math.min(activeIndex, Math.max(options.length - 1, 0));

  function openList() {
    setQuery(value?.name ?? "");
    setActiveIndex(Math.max(0, value ? palsByName.indexOf(value) : 0));
    setOpen(true);
  }

  function choose(pal: Pal) {
    onChange(pal);
    setOpen(false);
    setQuery("");
  }

  function scrollToOption(index: number) {
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const next =
        event.key === "ArrowDown"
          ? Math.min(active + 1, options.length - 1)
          : Math.max(active - 1, 0);
      setActiveIndex(next);
      scrollToOption(next);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const pal = options[active];
      if (pal) choose(pal);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[var(--ink)]">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-option-${options[active].id}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={open ? query : (value?.name ?? "")}
          onFocus={(event) => {
            openList();
            event.currentTarget.select();
          }}
          onClick={() => {
            if (!open) openList();
          }}
          onBlur={() => {
            setOpen(false);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
            listRef.current?.scrollTo({ top: 0 });
          }}
          onKeyDown={handleKeyDown}
          className="h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-9 pr-16 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)]"
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
          {value && !open ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Clear ${label.toLowerCase()}`}
              title="Clear"
              className="grid size-8 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onMouseDown={(event) => {
              event.preventDefault();
              if (open) setOpen(false);
              else inputRef.current?.focus();
            }}
            className="grid size-8 place-items-center rounded-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>

        {open ? (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-[var(--line)] bg-[var(--surface)] p-1 shadow-[0_16px_40px_rgb(23_35_29_/_14%)]"
          >
            {options.length ? (
              options.map((pal, index) => (
                <li
                  key={pal.id}
                  id={`${id}-option-${pal.id}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => {
                    if (index !== active) setActiveIndex(index);
                  }}
                  onClick={() => choose(pal)}
                  className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-1.5 text-sm ${
                    index === active ? "bg-[var(--paper)] text-[var(--ink)]" : "text-[var(--ink)]"
                  } ${value?.id === pal.id ? "font-semibold" : ""}`}
                >
                  <span className="min-w-0 truncate">{pal.name}</span>
                  <span className="shrink-0">
                    <ElementBadges elements={pal.elements} size="xs" />
                  </span>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-sm text-[var(--muted)]">
                No Pal matches “{query.trim()}”. Check the spelling.
              </li>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
