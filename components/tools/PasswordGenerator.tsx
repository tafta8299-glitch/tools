"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

const characterGroups = {
  uppercase: {
    label: "Uppercase letters",
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  lowercase: {
    label: "Lowercase letters",
    characters: "abcdefghijklmnopqrstuvwxyz",
  },
  numbers: { label: "Numbers", characters: "0123456789" },
  symbols: { label: "Symbols", characters: "!@#$%^&*_-+=?" },
} as const;

type CharacterGroup = keyof typeof characterGroups;

const groupOrder = Object.keys(characterGroups) as CharacterGroup[];
const ambiguousCharacters = /[Il1O0]/g;

function secureRandomIndex(maxExclusive: number): number {
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const randomValues = new Uint32Array(1);
  let value: number;

  do {
    window.crypto.getRandomValues(randomValues);
    value = randomValues[0];
  } while (value >= limit);

  return value % maxExclusive;
}

function generateSecurePassword(
  length: number,
  enabledGroups: Record<CharacterGroup, boolean>,
  excludeAmbiguous: boolean,
): string {
  const activeGroups = groupOrder
    .filter((group) => enabledGroups[group])
    .map((group) => {
      const characters = characterGroups[group].characters;
      return excludeAmbiguous ? characters.replace(ambiguousCharacters, "") : characters;
    });

  if (activeGroups.length === 0) {
    throw new Error("Select at least one character group.");
  }

  if (activeGroups.length > length) {
    throw new Error("Password length must fit every selected character group.");
  }

  const pool = activeGroups.join("");
  const passwordCharacters = activeGroups.map(
    (characters) => characters[secureRandomIndex(characters.length)],
  );

  while (passwordCharacters.length < length) {
    passwordCharacters.push(pool[secureRandomIndex(pool.length)]);
  }

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1);
    [passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ];
  }

  return passwordCharacters.join("");
}

export function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [enabledGroups, setEnabledGroups] = useState<
    Record<CharacterGroup, boolean>
  >({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const activeGroupCount = groupOrder.filter(
    (group) => enabledGroups[group],
  ).length;
  const canGenerate = activeGroupCount > 0 && activeGroupCount <= length;

  function clearResult() {
    setPassword("");
    setFeedback("");
    setIsCopied(false);
  }

  function updateGroup(group: CharacterGroup, checked: boolean) {
    setEnabledGroups((current) => ({ ...current, [group]: checked }));
    clearResult();
  }

  function createPassword() {
    try {
      setPassword(generateSecurePassword(length, enabledGroups, excludeAmbiguous));
      setFeedback("");
      setIsCopied(false);
    } catch {
      setPassword("");
      setFeedback("Select at least one character group to generate a password.");
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
      setFeedback("Password copied to clipboard.");
    } catch {
      setIsCopied(false);
      setFeedback("Clipboard access is unavailable. Select the password to copy it.");
    }
  }

  return (
    <div className="grid gap-8 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-7">
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label
              htmlFor="password-length"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              Password length
            </label>
            <span className="min-w-16 text-right text-sm font-semibold tabular-nums text-[var(--ink)]">
              {length} characters
            </span>
          </div>
          <input
            id="password-length"
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(event) => {
              setLength(Number(event.target.value));
              clearResult();
            }}
            className="h-2 w-full cursor-pointer accent-[var(--accent-dark)]"
          />
          <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-[var(--ink)]">
            Include character types
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {groupOrder.map((group) => (
              <label
                key={group}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
              >
                <input
                  type="checkbox"
                  checked={enabledGroups[group]}
                  onChange={(event) => updateGroup(group, event.target.checked)}
                  className="size-4 accent-[var(--accent-dark)]"
                />
                {characterGroups[group].label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="inline-flex min-h-10 items-center gap-2.5 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(event) => {
              setExcludeAmbiguous(event.target.checked);
              clearResult();
            }}
            className="size-4 accent-[var(--accent-dark)]"
          />
          Exclude similar-looking characters (I, l, 1, O, 0)
        </label>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-[var(--line)] bg-[var(--paper)] p-5 text-center sm:p-6">
        <div className="grid min-h-28 w-full place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 py-5">
          {password ? (
            <output
              aria-label="Generated password"
              className="max-h-40 w-full select-all break-all font-mono text-lg leading-8 text-[var(--ink)]"
            >
              {password}
            </output>
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Set your options, then generate a secure password.
            </p>
          )}
        </div>

        <p aria-live="polite" className="mt-3 min-h-5 text-xs text-[var(--muted)]">
          {feedback}
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={createPassword}
            disabled={!canGenerate}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            {password ? "Generate new" : "Generate password"}
          </button>
          {password && (
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent-dark)]"
            >
              {isCopied ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <Copy aria-hidden="true" className="size-4" />
              )}
              {isCopied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        {!canGenerate && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Select at least one character type.
          </p>
        )}
      </div>
    </div>
  );
}