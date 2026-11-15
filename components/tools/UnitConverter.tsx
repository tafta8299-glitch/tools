"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, Copy } from "lucide-react";

const unitGroups = {
  Length: [
    { unit: "Meters", factor: 1 }, { unit: "Kilometers", factor: 1000 },
    { unit: "Centimeters", factor: 0.01 }, { unit: "Millimeters", factor: 0.001 },
    { unit: "Miles", factor: 1609.344 }, { unit: "Yards", factor: 0.9144 },
    { unit: "Feet", factor: 0.3048 }, { unit: "Inches", factor: 0.0254 },
  ],
  Mass: [
    { unit: "Kilograms", factor: 1 }, { unit: "Grams", factor: 0.001 },
    { unit: "Milligrams", factor: 0.000001 }, { unit: "Pounds", factor: 0.45359237 },
    { unit: "Ounces", factor: 0.028349523125 },
  ],
  Temperature: [
    { unit: "Celsius", factor: 1 }, { unit: "Fahrenheit", factor: 1 }, { unit: "Kelvin", factor: 1 },
  ],
  Data: [
    { unit: "Bytes", factor: 1 }, { unit: "Kilobytes (SI)", factor: 1000 },
    { unit: "Megabytes (SI)", factor: 1_000_000 }, { unit: "Gigabytes (SI)", factor: 1_000_000_000 },
    { unit: "Kibibytes", factor: 1024 }, { unit: "Mebibytes", factor: 1_048_576 },
    { unit: "Gibibytes", factor: 1_073_741_824 },
  ],
} as const;

type Category = keyof typeof unitGroups;
type Unit = (typeof unitGroups)[Category][number]["unit"];

function toBase(value: number, category: Category, unit: Unit): number {
  if (category === "Temperature") {
    if (unit === "Fahrenheit") return (value - 32) * 5 / 9;
    if (unit === "Kelvin") return value - 273.15;
    return value;
  }

  return value * unitGroups[category].find((option) => option.unit === unit)!.factor;
}

function fromBase(value: number, category: Category, unit: Unit): number {
  if (category === "Temperature") {
    if (unit === "Fahrenheit") return value * 9 / 5 + 32;
    if (unit === "Kelvin") return value + 273.15;
    return value;
  }

  return value / unitGroups[category].find((option) => option.unit === unit)!.factor;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(Number(value.toPrecision(12)));
}

export function UnitConverter() {
  const [category, setCategory] = useState<Category>("Length");
  const [fromUnit, setFromUnit] = useState<Unit>("Meters");
  const [toUnit, setToUnit] = useState<Unit>("Feet");
  const [value, setValue] = useState("1");
  const [copied, setCopied] = useState(false);
  const units = unitGroups[category] as readonly { unit: Unit; factor: number }[];
  const numericValue = value.trim() === "" ? Number.NaN : Number(value);
  const convertedNumber = Number.isFinite(numericValue)
    ? fromBase(toBase(numericValue, category, fromUnit), category, toUnit)
    : Number.NaN;
  const converted = formatNumber(convertedNumber);

  function changeCategory(nextCategory: Category) {
    const nextUnits = unitGroups[nextCategory];
    setCategory(nextCategory);
    setFromUnit(nextUnits[0].unit);
    setToUnit(nextUnits[1].unit);
    setCopied(false);
  }

  function swapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setValue(Number.isFinite(convertedNumber) ? String(convertedNumber) : "");
    setCopied(false);
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(converted);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
      <div className="space-y-5">
        <div>
          <label htmlFor="unit-category" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Measurement</label>
          <select id="unit-category" value={category} onChange={(event) => changeCategory(event.target.value as Category)} className="h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
            {Object.keys(unitGroups).map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="unit-value" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Value</label>
          <input id="unit-value" type="number" step="any" value={value} onChange={(event) => { setValue(event.target.value); setCopied(false); }} className="h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-end gap-2">
          <div>
            <label htmlFor="unit-from" className="mb-2 block text-xs font-semibold text-[var(--muted)]">From</label>
            <select id="unit-from" value={fromUnit} onChange={(event) => { setFromUnit(event.target.value as Unit); setCopied(false); }} className="h-11 w-full min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
              {units.map(({ unit }) => <option key={unit}>{unit}</option>)}
            </select>
          </div>
          <button type="button" onClick={swapUnits} aria-label="Swap units" title="Swap units" className="mb-1 grid size-9 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]">
            <ArrowLeftRight aria-hidden="true" className="size-4" />
          </button>
          <div>
            <label htmlFor="unit-to" className="mb-2 block text-xs font-semibold text-[var(--muted)]">To</label>
            <select id="unit-to" value={toUnit} onChange={(event) => { setToUnit(event.target.value as Unit); setCopied(false); }} className="h-11 w-full min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]">
              {units.map(({ unit }) => <option key={unit}>{unit}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--ink)]">Result</p>
        <div className="flex min-h-32 items-center justify-between gap-4 rounded-md border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="min-w-0">
            <p className="break-all font-mono text-3xl font-semibold leading-tight text-[var(--ink)]">{converted || "—"}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{toUnit}</p>
          </div>
          <button type="button" onClick={copyResult} disabled={!converted} aria-label="Copy converted value" title="Copy result" className="grid size-10 shrink-0 place-items-center rounded-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-45">
            {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          Data conversions distinguish decimal (SI) units from binary (IEC) units.
        </p>
      </div>
    </div>
  );
}