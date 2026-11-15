"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Egg, Plus, Search, Sparkles, Users } from "lucide-react";
import { palDataGameVersion, type Pal, type PalGender } from "@/data/palworld-pals";
import { breed, findParents, type BreedingOutcome, type ParentPair } from "@/lib/palworld-breeding";
import { ElementBadges } from "./palworld/ElementBadges";
import { PalPicker } from "./palworld/PalPicker";

type Mode = "child" | "parents";

const PAGE_SIZE = 50;

const modes = [
  { value: "child", label: "Find the child", icon: Egg },
  { value: "parents", label: "Find the parents", icon: Users },
] as const;

function withGender(name: string, gender?: PalGender) {
  return gender ? `${name} (${gender})` : name;
}

function reasonNote(outcome: BreedingOutcome, parentA: Pal, parentB: Pal) {
  if (outcome.reason === "same") {
    return `Two ${parentA.name} always make another ${parentA.name}.`;
  }
  if (outcome.reason === "special") {
    return outcome.parentAGender
      ? `Special pair: the result depends on which parent is female and which is male.`
      : `Special pair: ${parentA.name} and ${parentB.name} always make ${outcome.child.name}.`;
  }
  return null;
}

export function PalworldBreedingCalculator() {
  const [mode, setMode] = useState<Mode>("child");
  const [parentA, setParentA] = useState<Pal | null>(null);
  const [parentB, setParentB] = useState<Pal | null>(null);
  const [target, setTarget] = useState<Pal | null>(null);
  const [filter, setFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  function showParentsOf(pal: Pal) {
    setTarget(pal);
    setFilter("");
    setVisibleCount(PAGE_SIZE);
    setMode("parents");
  }

  return (
    <div className="space-y-6 pt-6">
      <div
        role="group"
        aria-label="What do you want to find?"
        className="grid grid-cols-2 gap-1 rounded-md bg-[var(--paper)] p-1"
      >
        {modes.map((choice) => {
          const Icon = choice.icon;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={mode === choice.value}
              onClick={() => setMode(choice.value)}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded text-sm font-semibold transition-colors ${
                mode === choice.value
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {choice.label}
            </button>
          );
        })}
      </div>

      {mode === "child" ? (
        <ChildFinder
          parentA={parentA}
          parentB={parentB}
          onParentAChange={setParentA}
          onParentBChange={setParentB}
          onShowParents={showParentsOf}
        />
      ) : (
        <ParentFinder
          target={target}
          filter={filter}
          visibleCount={visibleCount}
          onTargetChange={(pal) => {
            setTarget(pal);
            setFilter("");
            setVisibleCount(PAGE_SIZE);
          }}
          onFilterChange={(text) => {
            setFilter(text);
            setVisibleCount(PAGE_SIZE);
          }}
          onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
        />
      )}

      <p className="border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
        Results match Palworld version {palDataGameVersion}. A game update can change which Pals
        hatch, so check back after big patches. This is a fan-made tool and isn&apos;t connected
        to the game&apos;s makers.
      </p>
    </div>
  );
}

function ChildFinder({
  parentA,
  parentB,
  onParentAChange,
  onParentBChange,
  onShowParents,
}: {
  parentA: Pal | null;
  parentB: Pal | null;
  onParentAChange: (pal: Pal | null) => void;
  onParentBChange: (pal: Pal | null) => void;
  onShowParents: (pal: Pal) => void;
}) {
  const outcomes = parentA && parentB ? breed(parentA, parentB) : [];

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-[var(--muted)]">
        Pick two parent Pals to see which Pal hatches from their egg.
      </p>

      <div className="grid gap-2">
        <PalPicker label="First parent" value={parentA} onChange={onParentAChange} />
        <span
          aria-hidden="true"
          className="mx-auto -mb-2 grid size-8 place-items-center rounded-full bg-[var(--paper)] text-[var(--muted)]"
        >
          <Plus className="size-4" />
        </span>
        <PalPicker label="Second parent" value={parentB} onChange={onParentBChange} />
      </div>

      <div aria-live="polite">
        {parentA && parentB ? (
          <div className="rounded-md border border-[var(--line)] bg-[var(--paper)] p-5">
            <p className="text-sm font-semibold text-[var(--muted)]">
              {outcomes.length > 1 ? "Their child can be" : "Their child"}
            </p>
            <ul className="mt-3 space-y-4">
              {outcomes.map((outcome) => (
                <li key={outcome.child.id}>
                  {outcome.parentAGender && outcome.parentBGender ? (
                    <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                      If {parentA.name} is {outcome.parentAGender} and {parentB.name} is{" "}
                      {outcome.parentBGender}:
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="text-2xl font-semibold leading-tight text-[var(--ink)]">
                      {outcome.child.name}
                    </p>
                    <ElementBadges elements={outcome.child.elements} />
                  </div>
                  <button
                    type="button"
                    onClick={() => onShowParents(outcome.child)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-dark)] hover:text-[var(--ink)]"
                  >
                    See every way to get {outcome.child.name}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {outcomes[0] && reasonNote(outcomes[0], parentA, parentB) ? (
              <p className="mt-4 flex items-start gap-1.5 border-t border-[var(--line)] pt-3 text-xs leading-5 text-[var(--muted)]">
                <Sparkles aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--accent-dark)]" />
                <span>{reasonNote(outcomes[0], parentA, parentB)}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-[var(--line)] p-5 text-center">
            <p className="text-sm text-[var(--muted)]">
              {parentA || parentB
                ? "Now pick the other parent."
                : "Your result will appear here once both parents are picked."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function sortPairs(pairs: ParentPair[]): ParentPair[] {
  const rank = (pair: ParentPair) => (pair.outcome.reason === "formula" ? 1 : 0);
  return pairs
    .map((pair) =>
      pair.parentA.name.localeCompare(pair.parentB.name) <= 0
        ? pair
        : {
            parentA: pair.parentB,
            parentB: pair.parentA,
            outcome: {
              ...pair.outcome,
              parentAGender: pair.outcome.parentBGender,
              parentBGender: pair.outcome.parentAGender,
            },
          },
    )
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        a.parentA.name.localeCompare(b.parentA.name) ||
        a.parentB.name.localeCompare(b.parentB.name),
    );
}

function ParentFinder({
  target,
  filter,
  visibleCount,
  onTargetChange,
  onFilterChange,
  onShowMore,
}: {
  target: Pal | null;
  filter: string;
  visibleCount: number;
  onTargetChange: (pal: Pal | null) => void;
  onFilterChange: (text: string) => void;
  onShowMore: () => void;
}) {
  const allPairs = useMemo(() => (target ? sortPairs(findParents(target)) : []), [target]);
  const filterText = filter.trim().toLocaleLowerCase();
  // Match the start of a name or of any word in it ("lux" finds "Celaray Lux").
  const nameMatches = (pal: Pal) =>
    pal.name
      .toLocaleLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(filterText)) ||
    pal.name.toLocaleLowerCase().startsWith(filterText);
  const pairs = filterText
    ? allPairs.filter((pair) => nameMatches(pair.parentA) || nameMatches(pair.parentB))
    : allPairs;
  const shown = pairs.slice(0, visibleCount);
  const onlySpecial = allPairs.every((pair) => pair.outcome.reason !== "formula");

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-[var(--muted)]">
        Pick the Pal you want, and see every pair of parents that can hatch it.
      </p>

      <PalPicker label="Pal you want" value={target} onChange={onTargetChange} />

      {target ? (
        <div className="space-y-4">
          <div className="rounded-md border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-lg font-semibold text-[var(--ink)]">{target.name}</p>
              <ElementBadges elements={target.elements} />
            </div>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {allPairs.length === 1
                ? `Only 1 pair of parents makes ${target.name}.`
                : `${allPairs.length.toLocaleString()} different pairs of parents make ${target.name}.`}
              {onlySpecial && allPairs.length > 0
                ? ` ${target.name} can't be made any other way.`
                : ""}
            </p>
          </div>

          {allPairs.length > 8 ? (
            <div>
              <label htmlFor="pal-pair-filter" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
                Only show pairs that include… <span className="font-normal text-[var(--muted)]">(optional)</span>
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  id="pal-pair-filter"
                  type="search"
                  value={filter}
                  onChange={(event) => onFilterChange(event.target.value)}
                  placeholder="A Pal you already have"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-dark)]"
                />
              </div>
            </div>
          ) : null}

          <div aria-live="polite">
            <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
              {pairs.length === 0
                ? `No pairs include “${filter.trim()}”.`
                : pairs.length > shown.length
                  ? `Showing ${shown.length.toLocaleString()} of ${pairs.length.toLocaleString()} pairs`
                  : `${pairs.length.toLocaleString()} ${pairs.length === 1 ? "pair" : "pairs"}`}
            </p>
            {shown.length ? (
              <ul className="divide-y divide-[var(--line)] rounded-md border border-[var(--line)] bg-[var(--surface)]">
                {shown.map((pair) => (
                  <li
                    key={`${pair.parentA.id}|${pair.parentB.id}|${pair.outcome.parentAGender ?? ""}`}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2.5"
                  >
                    <ParentName pal={pair.parentA} gender={pair.outcome.parentAGender} />
                    <Plus aria-label="plus" className="size-3.5 shrink-0 text-[var(--muted)]" />
                    <ParentName pal={pair.parentB} gender={pair.outcome.parentBGender} />
                    {pair.outcome.reason !== "formula" ? (
                      <span className="ml-auto rounded-full bg-[var(--accent)]/55 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-dark)]">
                        {pair.outcome.reason === "same" ? "Same Pal" : "Special pair"}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {pairs.length > shown.length ? (
              <button
                type="button"
                onClick={onShowMore}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] hover:border-[var(--accent-dark)]"
              >
                Show {Math.min(PAGE_SIZE, pairs.length - shown.length)} more
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-[var(--line)] p-5 text-center">
          <p className="text-sm text-[var(--muted)]">
            The list of parents will appear here once you pick a Pal.
          </p>
        </div>
      )}
    </div>
  );
}

function ParentName({ pal, gender }: { pal: Pal; gender?: PalGender }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="text-sm font-semibold text-[var(--ink)]">{withGender(pal.name, gender)}</span>
      <ElementBadges elements={pal.elements} size="xs" />
    </span>
  );
}
