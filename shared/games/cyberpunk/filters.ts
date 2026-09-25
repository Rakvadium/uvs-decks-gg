/**
 * Cyberpunk TCG gallery filter definition (pure data): cost / power / RAM stat rules, color and
 * tag facets; no UVS symbols, zones, keywords or card flags.
 */
import type {
  GameFilterDefinition,
  GameStatFilterDescriptor,
  StatFilterFields,
  StatRangeFilterFields,
} from "../filters";
import { CYBERPUNK_COLORS, CYBERPUNK_COLOR_LABELS, CYBERPUNK_COLOR_SWATCHES } from "./card-types";

export const CYBERPUNK_FILTER_GROUPS = [{ id: "stats", label: "Stats" }] as const;

export type CyberpunkFilterGroupId = (typeof CYBERPUNK_FILTER_GROUPS)[number]["id"];

/** Stat keys in URL/serialization order. */
export const CYBERPUNK_STAT_FILTER_KEYS = ["cost", "power", "ram"] as const;

export type CyberpunkStatFilterKey = (typeof CYBERPUNK_STAT_FILTER_KEYS)[number];

export const CYBERPUNK_STAT_FILTERS = [
  { key: "cost", label: "Cost", group: "stats", cardField: "cost", applyRange: true, rangeCountsAsActive: true, sortable: true },
  { key: "power", label: "Power", group: "stats", cardField: "power", applyRange: true, rangeCountsAsActive: true, sortable: true },
  { key: "ram", label: "RAM", group: "stats", cardField: "ram", applyRange: true, rangeCountsAsActive: true, sortable: true },
] as const satisfies readonly GameStatFilterDescriptor<CyberpunkStatFilterKey, CyberpunkFilterGroupId>[];

export const CYBERPUNK_COLOR_FACET_OPTIONS = CYBERPUNK_COLORS.map((color) => ({
  value: color,
  label: CYBERPUNK_COLOR_LABELS[color],
  swatch: CYBERPUNK_COLOR_SWATCHES[color],
}));

export const CYBERPUNK_FILTER_DEFINITION: GameFilterDefinition = {
  facets: {
    symbols: false,
    zones: false,
    keywords: false,
    uvsCardFlags: false,
    colors: CYBERPUNK_COLOR_FACET_OPTIONS,
    tags: true,
  },
  groups: CYBERPUNK_FILTER_GROUPS,
  stats: CYBERPUNK_STAT_FILTERS,
  zones: [],
  statParamOrder: CYBERPUNK_STAT_FILTER_KEYS,
  zoneParamOrder: [],
};

/** Stat and range fields of the persisted filters shape for Cyberpunk. */
export type CyberpunkStatFilterFields = StatFilterFields<CyberpunkStatFilterKey> &
  StatRangeFilterFields<CyberpunkStatFilterKey>;
