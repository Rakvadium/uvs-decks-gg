"use client";

import { useMemo } from "react";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import type { CardFilters } from "@/providers/UIStateProvider";

export const STATS_FILTER_KEYS = [
  "difficulty",
  "control",
  "speed",
  "damage",
  "blockModifier",
  "handSize",
  "health",
  "stamina",
  "blockZone",
  "attackZone",
] as const satisfies readonly (keyof CardFilters)[];

const STAT_VALUE_KEYS = [
  "difficulty",
  "control",
  "speed",
  "damage",
  "blockModifier",
  "handSize",
  "health",
  "stamina",
] as const;

export function statsFilterCount(filters: CardFilters): number {
  let count = 0;
  for (const key of STAT_VALUE_KEYS) {
    const statValue = filters[key];
    if (
      statValue &&
      typeof statValue === "object" &&
      "value" in statValue &&
      statValue.value !== undefined
    ) {
      count += 1;
    }
  }
  count += filters.blockZone?.length ?? 0;
  count += filters.attackZone?.length ?? 0;
  return count;
}

export function formatSymbolLabel(symbol: string): string {
  return symbol.startsWith("attuned:") ? `${symbol.slice(8)}*` : symbol;
}

export interface ActiveFilterToken {
  id: string;
  label: string;
  values: string[];
  count: number;
  clear: () => void;
}

export function useActiveFilterTokens(): ActiveFilterToken[] {
  const { filters, meta, actions, setOptions } = useGalleryFilterDialogContext();

  return useMemo(() => {
    const tokens: ActiveFilterToken[] = [];

    if (filters.format && filters.format !== meta.defaultFormatKey) {
      const formatName =
        meta.formats.find((format) => format.key === filters.format)?.name ?? filters.format;
      tokens.push({
        id: "format",
        label: "Format",
        values: [formatName],
        count: 1,
        clear: () => actions.removeFilterKeys(["format"]),
      });
    }

    const setCodes = filters.set ?? [];
    if (setCodes.length > 0) {
      tokens.push({
        id: "set",
        label: "Set",
        values: setCodes.map(
          (code) => setOptions.find((option) => option.code === code)?.name ?? code
        ),
        count: setCodes.length,
        clear: () => actions.removeFilterKeys(["set"]),
      });
    }

    const types = filters.type ?? [];
    if (types.length > 0) {
      tokens.push({
        id: "type",
        label: "Type",
        values: types,
        count: types.length,
        clear: () => actions.removeFilterKeys(["type"]),
      });
    }

    const symbols = filters.symbols ?? [];
    const excludesInfinity = filters.includeInfinity === false;
    if (symbols.length > 0 || excludesInfinity) {
      const values = symbols.map(formatSymbolLabel);
      if (excludesInfinity) values.push("no ∞");
      tokens.push({
        id: "symbols",
        label: "Symbols",
        values,
        count: symbols.length + (excludesInfinity ? 1 : 0),
        clear: () =>
          actions.removeFilterKeys(["symbols", "symbolMatchAll", "includeInfinity"]),
      });
    }

    const keywords = filters.keywords ?? [];
    if (keywords.length > 0) {
      tokens.push({
        id: "keywords",
        label: "Keywords",
        values: keywords,
        count: keywords.length,
        clear: () => actions.removeFilterKeys(["keywords", "keywordMatchAll"]),
      });
    }

    const statCount = statsFilterCount(filters);
    if (statCount > 0) {
      tokens.push({
        id: "stats",
        label: "Stats",
        values: [`${statCount} active`],
        count: statCount,
        clear: () => actions.removeFilterKeys([...STATS_FILTER_KEYS]),
      });
    }

    return tokens;
  }, [filters, meta.defaultFormatKey, meta.formats, actions, setOptions]);
}

export function summarizeTokenValues(values: string[], maxVisible = 2): string {
  const shown = values.slice(0, maxVisible);
  const rest = values.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest}` : shown.join(", ");
}
