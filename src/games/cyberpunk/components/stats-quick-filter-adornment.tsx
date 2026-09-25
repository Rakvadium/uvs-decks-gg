"use client";

import { CYBERPUNK_STAT_FILTERS } from "@shared/games/cyberpunk/filters";
import { STAT_OPERATOR_OPTIONS } from "@shared/games/filters";
import type { GameStatsQuickFilterAdornmentProps } from "@/games/types";

const GLYPHS = Object.fromEntries(STAT_OPERATOR_OPTIONS.map((option) => [option.value, option.glyph]));

/** Compact chips for active cost / power / RAM rules. */
export function StatsQuickFilterAdornment({ filters }: GameStatsQuickFilterAdornmentProps) {
  const chips = CYBERPUNK_STAT_FILTERS.flatMap((stat) => {
    const rule = filters[stat.key];
    if (!rule || rule.value === undefined) return [];
    return [{ key: stat.key, label: stat.label, text: `${GLYPHS[rule.operator] ?? "="} ${rule.value}` }];
  });
  if (chips.length === 0) return null;

  return (
    <span className="flex min-w-0 flex-wrap items-center justify-end gap-0.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="chrome-label-case inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/40 bg-primary/20 px-1 py-px text-[10px] font-bold text-primary"
        >
          {chip.label}
          <span className="normal-case tabular-nums">{chip.text}</span>
        </span>
      ))}
    </span>
  );
}
