"use client";

import { ACCEPTED_IMAGE_TYPES } from "@/components/tools/image/image-utils";

export function ImageFilePicker({
  id,
  onSelect,
  disabled = false,
  accept = ACCEPTED_IMAGE_TYPES,
  maxSizeLabel = "Images up to 50 MB",
}: {
  id: string;
  onSelect: (file?: File) => void;
  disabled?: boolean;
  accept?: string;
  maxSizeLabel?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[var(--ink)]">
        Choose an image
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          onSelect(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
        className="block min-h-11 w-full cursor-pointer rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--muted)] file:mr-3 file:h-11 file:border-0 file:bg-[var(--paper)] file:px-3 file:text-sm file:font-semibold file:text-[var(--ink)]"
      />
      <p className="mt-2 text-xs text-[var(--muted)]">{maxSizeLabel}</p>
    </div>
  );
}