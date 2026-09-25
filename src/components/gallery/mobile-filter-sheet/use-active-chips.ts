"use client";

import { useMemo } from "react";
import { toggleCanonicalRarityFilter } from "@/lib/universus/rarity";
import { STAT_OPERATOR_OPTIONS, statStandaloneLabel } from "@shared/games/filters";
import { useGameModule } from "@/games/game-context";
import type { StatOperator } from "@/providers/UIStateProvider";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";
import type { StatFilterKey, StringArrayFilterKey } from "../filter-dialog/types";
import { colorFacetLabel } from "./color-facet-chips";

export const OPERATOR_GLYPHS = Object.fromEntries(
  STAT_OPERATOR_OPTIONS.map((option) => [option.value, option.glyph])
) as Record<StatOperator, string>;

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
  const { filters: filterDefinition } = useGameModule();

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

    for (const color of filters.colors ?? []) {
      chips.push({
        id: `color:${color}`,
        label: colorFacetLabel(filterDefinition.facets.colors, color),
        remove: () => toggleStringFilter("colors", color),
      });
    }

    for (const symbol of filters.symbols ?? []) {
      chips.push({ id: `symbol:${symbol}`, label: symbolLabel(symbol), remove: () => toggleStringFilter("symbols", symbol) });
    }

    if (filters.includeInfinity === false) {
      chips.push({ id: "infinity", label: "No Infinity", remove: () => setIncludeInfinityResults(true) });
    }

    if (filters.includeBanned === true) {
      chips.push({
        id: "includeBanned",
        label: "Include banned",
        remove: () => actions.updateFilter("includeBanned", undefined),
      });
    }

    for (const keyword of filters.keywords ?? []) {
      chips.push({ id: `keyword:${keyword}`, label: keyword, remove: () => toggleStringFilter("keywords", keyword) });
    }

    for (const tag of filters.tags ?? []) {
      chips.push({ id: `tag:${tag}`, label: tag, remove: () => toggleStringFilter("tags", tag) });
    }

    for (const descriptor of filterDefinition.zones) {
      const key = descriptor.key as StringArrayFilterKey;
      for (const zone of filters[key] ?? []) {
        chips.push({
          id: `${key}:${zone}`,
          label: `${descriptor.standaloneLabel} ${zone}`,
          remove: () => toggleStringFilter(key, zone),
        });
      }
    }

    for (const descriptor of filterDefinition.stats) {
      const key = descriptor.key as StatFilterKey;
      const value = filters[key];
      if (!value || value.value === undefined) continue;
      const operator = OPERATOR_GLYPHS[value.operator] ?? "=";
      chips.push({
        id: `stat:${key}`,
        label: `${statStandaloneLabel(descriptor)} ${operator} ${value.value}`,
        remove: () => setStatFilter(key, undefined),
      });
    }

    return chips;
  }, [actions, filterDefinition, filters, meta.formats, setIncludeInfinityResults, setOptions, setStatFilter, toggleFormat, toggleStringFilter]);
}
