/**
 * UniVersus gallery filter definition (pure data). Drives the stat/zone filter UIs, URL state,
 * active chips/counts, and the stat/zone/range branches of `filterCards` / `sortCards`.
 */
import type {
  GameFilterDefinition,
  GameStatFilterDescriptor,
  GameZoneFilterDescriptor,
  StatFilterFields,
  StatRangeFilterFields,
  ZoneFilterFields,
} from "../filters";
import { UVS_KEYWORD_LIST } from "./keywords";

export const UVS_FILTER_GROUPS = [
  { id: "general", label: "General" },
  { id: "block", label: "Block" },
  { id: "attack", label: "Attack" },
] as const;

export type UvsFilterGroupId = (typeof UVS_FILTER_GROUPS)[number]["id"];

/** Stat keys in URL/serialization order. */
export const UVS_STAT_FILTER_KEYS = [
  "difficulty",
  "control",
  "speed",
  "damage",
  "blockModifier",
  "handSize",
  "health",
  "stamina",
] as const;

export type UvsStatFilterKey = (typeof UVS_STAT_FILTER_KEYS)[number];

/** Zone keys in URL/serialization order. */
export const UVS_ZONE_FILTER_KEYS = ["attackZone", "blockZone"] as const;

export type UvsZoneFilterKey = (typeof UVS_ZONE_FILTER_KEYS)[number];

export const UVS_ZONE_OPTIONS = ["High", "Mid", "Low"] as const;

/** Stat descriptors in display order. */
export const UVS_STAT_FILTERS = [
  { key: "difficulty", label: "Difficulty", group: "general", cardField: "difficulty", applyRange: true, rangeCountsAsActive: true, sortable: true },
  { key: "control", label: "Control", group: "general", cardField: "control", applyRange: true, rangeCountsAsActive: true, sortable: true },
  { key: "health", label: "Health", group: "general", cardField: "health" },
  { key: "handSize", label: "Hand Size", group: "general", cardField: "handSize" },
  { key: "stamina", label: "Stamina", group: "general", cardField: "stamina" },
  { key: "blockModifier", label: "Modifier", standaloneLabel: "Block Mod", group: "block", cardField: "blockModifier" },
  { key: "speed", label: "Speed", group: "attack", cardField: "speed", applyRange: true, sortable: true },
  { key: "damage", label: "Damage", group: "attack", cardField: "damage", applyRange: true, sortable: true },
] as const satisfies readonly GameStatFilterDescriptor<UvsStatFilterKey, UvsFilterGroupId>[];

/** Zone descriptors in display order. */
export const UVS_ZONE_FILTERS = [
  { key: "blockZone", label: "Zone", standaloneLabel: "Block", group: "block", cardField: "blockZone", options: UVS_ZONE_OPTIONS },
  { key: "attackZone", label: "Zone", standaloneLabel: "Attack", group: "attack", cardField: "attackZone", options: UVS_ZONE_OPTIONS },
] as const satisfies readonly GameZoneFilterDescriptor<UvsZoneFilterKey, UvsFilterGroupId>[];

export const UVS_FILTER_DEFINITION: GameFilterDefinition = {
  // Today's UVS gallery: symbols, zones, keywords and the UVS card flags; no colors/tags.
  facets: { symbols: true, zones: true, keywords: true, uvsCardFlags: true, tags: false },
  groups: UVS_FILTER_GROUPS,
  stats: UVS_STAT_FILTERS,
  zones: UVS_ZONE_FILTERS,
  statParamOrder: UVS_STAT_FILTER_KEYS,
  zoneParamOrder: UVS_ZONE_FILTER_KEYS,
  keywordOptions: UVS_KEYWORD_LIST,
};

/** Stat, range, and zone fields of the persisted `CardFilters` shape. */
export type UvsStatZoneFilterFields = StatFilterFields<UvsStatFilterKey> &
  StatRangeFilterFields<UvsStatFilterKey> &
  ZoneFilterFields<UvsZoneFilterKey>;
