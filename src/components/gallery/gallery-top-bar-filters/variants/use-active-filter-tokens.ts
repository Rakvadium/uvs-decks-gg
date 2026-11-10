"use client";

import { useMemo } from "react";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import { useGameModule } from "@/games/game-context";
import type { CardFilters } from "@/providers/UIStateProvider";
import { colorFacetLabel } from "@/components/gallery/mobile-filter-sheet/color-facet-chips";
import {
  countActiveStatPageFilters,
  statPageFilterKeys,
  type GameFilterDefinition,
} from "@shared/games/filters";

export function statsFilterCount(
  filters: CardFilters,
  definition: GameFilterDefinition
): number {
  return countActiveStatPageFilters(definition, filters);
}

export function formatSymbolLabel(symbol: string): string {
  return symbol.startsWith("attuned:") ? `${symbol.slice(8)}*` : symbol;
}

export interface ActiveFilterToken {
  id: string;
  label: string;
  values: string[];
  count: number;
  active: boolean;
  clear: () => void;
}

export function useActiveFilterTokens(): ActiveFilterToken[] {
  const { filters, meta, actions, setOptions } = useGalleryFilterDialogContext();
  const { filters: filterDefinition } = useGameModule();

  return useMemo(() => {
    const tokens: ActiveFilterToken[] = [];
    const activeFormat = filters.format ?? meta.defaultFormatKey;
    const formatName =
      meta.formats.find((format) => format.key === activeFormat)?.name ?? activeFormat ?? "Any";
    const formatChanged = Boolean(filters.format && filters.format !== meta.defaultFormatKey);

    tokens.push({
      id: "format",
      label: "Format",
      values: [formatName],
      count: formatChanged ? 1 : 0,
      active: formatChanged,
      clear: () => actions.removeFilterKeys(["format"]),
    });

    if (filters.includeBanned === true) {
      tokens.push({
        id: "includeBanned",
        label: "Banned",
        values: ["included"],
        count: 1,
        active: true,
        clear: () => actions.removeFilterKeys(["includeBanned"]),
      });
    }

    const setCodes = filters.set ?? [];
    const setNames = setCodes.map(
      (code) => setOptions.find((option) => option.code === code)?.name ?? code
    );
    tokens.push({
      id: "sets",
      label: "Sets",
      values: setNames.length > 0 ? setNames : ["Any"],
      count: setCodes.length,
      active: setCodes.length > 0,
      clear: () => actions.removeFilterKeys(["set"]),
    });

    const types = filters.type ?? [];
    tokens.push({
      id: "type",
      label: "Type",
      values: types.length > 0 ? types : ["Any"],
      count: types.length,
      active: types.length > 0,
      clear: () => actions.removeFilterKeys(["type"]),
    });

    const { facets } = filterDefinition;

    if (facets.colors) {
      const colors = filters.colors ?? [];
      tokens.push({
        id: "colors",
        label: "Colors",
        values: colors.length > 0 ? colors.map((value) => colorFacetLabel(facets.colors, value)) : ["Any"],
        count: colors.length,
        active: colors.length > 0,
        clear: () => actions.removeFilterKeys(["colors"]),
      });
    }

    if (facets.symbols) {
      const symbols = filters.symbols ?? [];
      const excludesInfinity = filters.includeInfinity === false;
      const symbolValues = symbols.map(formatSymbolLabel);
      if (excludesInfinity) symbolValues.push("no ∞");
      const symbolsActive = symbols.length > 0 || excludesInfinity;
      tokens.push({
        id: "symbols",
        label: "Symbols",
        values: symbolsActive ? symbolValues : ["Any"],
        count: symbols.length + (excludesInfinity ? 1 : 0),
        active: symbolsActive,
        clear: () => actions.removeFilterKeys(["symbols", "symbolMatchAll", "includeInfinity"]),
      });
    }

    if (facets.keywords) {
      const keywords = filters.keywords ?? [];
      tokens.push({
        id: "keywords",
        label: "Keywords",
        values: keywords.length > 0 ? keywords : ["Any"],
        count: keywords.length,
        active: keywords.length > 0,
        clear: () => actions.removeFilterKeys(["keywords", "keywordMatchAll"]),
      });
    }

    if (facets.tags) {
      const tags = filters.tags ?? [];
      tokens.push({
        id: "tags",
        label: "Tags",
        values: tags.length > 0 ? tags : ["Any"],
        count: tags.length,
        active: tags.length > 0,
        clear: () => actions.removeFilterKeys(["tags"]),
      });
    }

    const statCount = statsFilterCount(filters, filterDefinition);
    tokens.push({
      id: "stats",
      label: "Stats",
      values: statCount > 0 ? [`${statCount} selected`] : ["Any"],
      count: statCount,
      active: statCount > 0,
      clear: () => actions.removeFilterKeys(statPageFilterKeys(filterDefinition) as (keyof CardFilters)[]),
    });

    const rarities = filters.rarity ?? [];
    tokens.push({
      id: "rarity",
      label: "Rarity",
      values: rarities.length > 0 ? rarities : ["Any"],
      count: rarities.length,
      active: rarities.length > 0,
      clear: () => actions.removeFilterKeys(["rarity"]),
    });

    return tokens;
  }, [filters, filterDefinition, meta.defaultFormatKey, meta.formats, actions, setOptions]);
}

export function summarizeTokenValues(values: string[], maxVisible = 2): string {
  const shown = values.slice(0, maxVisible);
  const rest = values.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest}` : shown.join(", ");
}
