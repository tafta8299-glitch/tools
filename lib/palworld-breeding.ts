import {
  pals,
  specialCombos,
  type Pal,
  type PalGender,
  type SpecialCombo,
} from "@/data/palworld-pals";

export type BreedingReason = "same" | "special" | "formula";

export type BreedingOutcome = {
  child: Pal;
  reason: BreedingReason;
  /** Only set when the result depends on which parent is male or female. */
  parentAGender?: PalGender;
  parentBGender?: PalGender;
};

export type ParentPair = {
  parentA: Pal;
  parentB: Pal;
  outcome: BreedingOutcome;
};

const palById = new Map(pals.map((pal) => [pal.id, pal]));

export function getPal(id: string): Pal | undefined {
  return palById.get(id);
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

const specialByPair = new Map<string, SpecialCombo[]>();
for (const combo of specialCombos) {
  const key = pairKey(combo.parentA, combo.parentB);
  specialByPair.set(key, [...(specialByPair.get(key) ?? []), combo]);
}

/** Pals the averaging formula can produce, in data order. */
const formulaPals = pals.filter((pal) => !pal.specialOnly);

/** True when `candidate` wins a tie against `current`. */
function winsTie(candidate: Pal, current: Pal): boolean {
  if (candidate.tieBreakPriority !== current.tieBreakPriority) {
    return candidate.tieBreakPriority > current.tieBreakPriority;
  }
  return !candidate.isVariant && current.isVariant;
}

function formulaChild(a: Pal, b: Pal): Pal {
  const target = Math.floor((a.breedingPower + b.breedingPower + 1) / 2);
  let best = formulaPals[0];
  let bestDistance = Math.abs(best.breedingPower - target);

  for (const pal of formulaPals) {
    const distance = Math.abs(pal.breedingPower - target);
    if (distance < bestDistance || (distance === bestDistance && winsTie(pal, best))) {
      best = pal;
      bestDistance = distance;
    }
  }

  return best;
}

/**
 * Every child two parents can make. Usually one result; a few special pairs
 * give a different child depending on which parent is male or female.
 */
export function breed(a: Pal, b: Pal): BreedingOutcome[] {
  if (a.id === b.id) return [{ child: a, reason: "same" }];

  const combos = specialByPair.get(pairKey(a.id, b.id));
  if (combos) {
    return combos.flatMap((combo) => {
      const child = palById.get(combo.child);
      if (!child) return [];
      const sameOrder = combo.parentA === a.id;
      return [
        {
          child,
          reason: "special" as const,
          parentAGender: sameOrder ? combo.parentAGender : combo.parentBGender,
          parentBGender: sameOrder ? combo.parentBGender : combo.parentAGender,
        },
      ];
    });
  }

  return [{ child: formulaChild(a, b), reason: "formula" }];
}

let parentsByChild: Map<string, ParentPair[]> | undefined;

/** All parent pairs (in any order, each listed once) that produce `child`. */
export function findParents(child: Pal): ParentPair[] {
  if (!parentsByChild) {
    const index = new Map<string, ParentPair[]>();
    for (let i = 0; i < pals.length; i++) {
      for (let j = i; j < pals.length; j++) {
        const parentA = pals[i];
        const parentB = pals[j];
        for (const outcome of breed(parentA, parentB)) {
          const list = index.get(outcome.child.id) ?? [];
          list.push({ parentA, parentB, outcome });
          index.set(outcome.child.id, list);
        }
      }
    }
    parentsByChild = index;
  }

  return parentsByChild.get(child.id) ?? [];
}
