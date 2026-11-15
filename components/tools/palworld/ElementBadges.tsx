import type { PalElement } from "@/data/palworld-pals";

const elementStyles: Record<PalElement, string> = {
  Neutral: "bg-stone-100 text-stone-700 ring-stone-300",
  Fire: "bg-orange-50 text-orange-800 ring-orange-200",
  Water: "bg-sky-50 text-sky-800 ring-sky-200",
  Grass: "bg-green-50 text-green-800 ring-green-200",
  Electric: "bg-yellow-50 text-yellow-800 ring-yellow-300",
  Ice: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  Ground: "bg-amber-50 text-amber-900 ring-amber-300",
  Dark: "bg-rose-50 text-rose-900 ring-rose-200",
  Dragon: "bg-violet-50 text-violet-800 ring-violet-200",
};

export function ElementBadges({
  elements,
  size = "sm",
}: {
  elements: readonly PalElement[];
  size?: "xs" | "sm";
}) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {elements.map((element) => (
        <span
          key={element}
          className={`rounded-full font-semibold ring-1 ring-inset ${elementStyles[element]} ${
            size === "xs" ? "px-1.5 text-[10px] leading-4" : "px-2 py-0.5 text-xs"
          }`}
        >
          {element}
        </span>
      ))}
    </span>
  );
}
