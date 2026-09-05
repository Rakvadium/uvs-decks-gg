"use client";

import { useMemo } from "react";
import { toggleCanonicalRarityFilter } from "@/lib/universus/rarity";
import type { StatOperator } from "@/providers/UIStateProvider";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";
import type { StatFilterKey } from "../filter-dialog/types";

export const OPERATOR_GLYPHS: Record<StatOperator, string> = {
  eq: "=",
  neq: "≠",
  gt: ">",
  lt: "<",
  gte: "≥",
  lte: "≤",
};

export const STAT_LABELS: Record<StatFilterKey, string> = {
  difficulty: "Difficulty",
  control: "Control",
  health: "Health",
  handSize: "Hand Size",
  stamina: "Stamina",
  blockModifier: "Block Mod",
  speed: "Speed",
  damage: "Damage",
};

export const STAT_KEYS = Object.keys(STAT_LABELS) as StatFilterKey[];

export interface ActiveChip {
  id: string;
  label: string;
  remove: () => void;
}

function symbolLabel(symbol: string) {
  const raw = symbol.startsWith("attuned:") ? symbol.slice("attuned:".length) : symbol;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function useActiveChips(): ActiveChip[] {
  const {
    filters,
    meta,
    actions,
    setOptions,
    toggleStringFilter,
    setStatFilter,
    setIncludeInfinityResults,
    toggleFormat,
  } = useGalleryFilterDialogContext();

  return useMemo(() => {
    const chips: ActiveChip[] = [];
    const defaultFormat = meta.formats[0]?.key;

    if (filters.format && filters.format !== defaultFormat) {
      const name = meta.formats.find((format) => format.key === filters.format)?.name ?? filters.format;
      chips.push({ id: `format:${filters.format}`, label: name, remove: () => toggleFormat(filters.format as string) });
    }

    for (const type of filters.type ?? []) {
      chips.push({ id: `type:${type}`, label: type, remove: () => toggleStringFilter("type", type) });
    }

    for (const rarity of filters.rarity ?? []) {
      chips.push({
        id: `rarity:${rarity}`,
        label: rarity,
        remove: () => actions.updateFilter("rarity", toggleCanonicalRarityFilter(filters.rarity, rarity)),
      });
    }

    for (const code of filters.set ?? []) {
      const name = setOptions.find((option) => option.code === code)?.name ?? code;
      chips.push({ id: `set:${code}`, label: name, remove: () => toggleStringFilter("set", code) });
    }

    for (const symbol of filters.symbols ?? []) {
      chips.push({ id: `symbol:${symbol}`, label: symbolLabel(symbol), remove: () => toggleStringFilter("symbols", symbol) });
    }

    if (filters.includeInfinity === false) {
      chips.push({ id: "infinity", label: "No Infinity", remove: () => setIncludeInfinityResults(true) });
    }

    for (const keyword of filters.keywords ?? []) {
      chips.push({ id: `keyword:${keyword}`, label: keyword, remove: () => toggleStringFilter("keywords", keyword) });
    }

    for (const zone of filters.blockZone ?? []) {
      chips.push({ id: `blockZone:${zone}`, label: `Block ${zone}`, remove: () => toggleStringFilter("blockZone", zone) });
    }

    for (const zone of filters.attackZone ?? []) {
      chips.push({ id: `attackZone:${zone}`, label: `Attack ${zone}`, remove: () => toggleStringFilter("attackZone", zone) });
    }

    for (const key of STAT_KEYS) {
      const value = filters[key];
      if (!value || value.value === undefined) continue;
      const operator = OPERATOR_GLYPHS[value.operator] ?? "=";
      chips.push({
        id: `stat:${key}`,
        label: `${STAT_LABELS[key]} ${operator} ${value.value}`,
        remove: () => setStatFilter(key, undefined),
      });
    }

    return chips;
  }, [actions, filters, meta.formats, setIncludeInfinityResults, setOptions, setStatFilter, toggleFormat, toggleStringFilter]);
}
