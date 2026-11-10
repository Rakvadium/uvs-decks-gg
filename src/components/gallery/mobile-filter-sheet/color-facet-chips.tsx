"use client";

import type { GameColorFacetOption } from "@shared/games/filters";
import { FilterChip, FilterChipRow } from "./primitives";

/** Swatch dot for a color facet option (`swatch` is an HSL triplet). */
export function ColorFacetSwatch({ swatch, className }: { swatch: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={className ?? "size-3 shrink-0 rounded-full ring-1 ring-inset ring-white/25"}
      style={{ backgroundColor: `hsl(${swatch})`, boxShadow: `0 0 6px hsl(${swatch} / 0.55)` }}
    />
  );
}

/** Color facet picker (`filters.colors`): one chip per option with its swatch. */
export function ColorFacetChips({
  options,
  selected,
  onToggle,
  chipClassName,
  rowClassName,
}: {
  options: readonly GameColorFacetOption[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  chipClassName?: string;
  rowClassName?: string;
}) {
  return (
    <FilterChipRow className={rowClassName}>
      {options.map((option) => (
        <FilterChip
          key={option.value}
          selected={selected.includes(option.value)}
          className={chipClassName}
          onClick={() => onToggle(option.value)}
          label={
            <span className="inline-flex items-center gap-1.5">
              <ColorFacetSwatch swatch={option.swatch} />
              {option.label}
            </span>
          }
        />
      ))}
    </FilterChipRow>
  );
}

/** Display label for a stored color value (`"red"` → `"Red"`), via the facet options. */
export function colorFacetLabel(options: readonly GameColorFacetOption[] | undefined, value: string): string {
  const match = options?.find((option) => option.value === value.toLowerCase());
  if (match) return match.label;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
