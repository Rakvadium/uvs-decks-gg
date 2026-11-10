/**
 * Game-agnostic card filter contract: operator stat rules, zone pickers, and the pure helpers
 * that interpret a game's filter definition. Pure TS (no React/Next/Convex runtime deps).
 *
 * Persisted shape (localStorage, Convex `sessions.galleryFilters`, URL params) is fixed:
 * - stat rule  `filters[key] = { operator, value }`, URL `key=op:value`
 * - legacy range `filters[`${key}Min`]` / `filters[`${key}Max`]` numbers, URL `keyMin=n`
 * - zone picker `filters[key] = string[]`, URL `key=a,b`
 */

export const STAT_OPERATOR_OPTIONS = [
  { value: "eq", label: "=", glyph: "=" },
  { value: "neq", label: "!=", glyph: "≠" },
  { value: "gt", label: ">", glyph: ">" },
  { value: "lt", label: "<", glyph: "<" },
  { value: "gte", label: ">=", glyph: "≥" },
  { value: "lte", label: "<=", glyph: "≤" },
] as const;

export type StatOperator = (typeof STAT_OPERATOR_OPTIONS)[number]["value"];

export interface StatFilterValue {
  operator: StatOperator;
  value: number;
}

const STAT_OPERATOR_SET: ReadonlySet<string> = new Set(STAT_OPERATOR_OPTIONS.map((o) => o.value));

export function isStatOperator(value: unknown): value is StatOperator {
  return typeof value === "string" && STAT_OPERATOR_SET.has(value);
}

/** Operator rule field map for a set of stat keys (e.g. `{ difficulty?: StatFilterValue }`). */
export type StatFilterFields<K extends string> = { [P in K]?: StatFilterValue };
/** Legacy min/max field map for a set of stat keys (e.g. `{ difficultyMin?: number }`). */
export type StatRangeFilterFields<K extends string> = { [P in K as `${P}Min` | `${P}Max`]?: number };
/** Zone picker field map (e.g. `{ attackZone?: string[] }`). */
export type ZoneFilterFields<K extends string> = { [P in K]?: string[] };

export interface GameStatFilterDescriptor<Key extends string = string, Group extends string = string> {
  /** Filters key holding a `StatFilterValue`; also the URL param. `${key}Min`/`${key}Max` are its range keys. */
  key: Key;
  /** Label inside its group (desktop/dialog stat inputs), e.g. "Modifier". */
  label: string;
  /** Label without group context (mobile stat rules, active chips). Defaults to `label`. */
  standaloneLabel?: string;
  group: Group;
  /** Numeric card field the rule compares against. */
  cardField: string;
  /** Whether filtering applies the `${key}Min`/`${key}Max` range keys (they are always serialized). */
  applyRange?: boolean;
  /** Whether a set range counts toward the gallery's active-filter badge. */
  rangeCountsAsActive?: boolean;
  /** Whether sorting by `key` compares `cardField` numerically (missing = 0). */
  sortable?: boolean;
}

export interface GameZoneFilterDescriptor<Key extends string = string, Group extends string = string> {
  /** Filters key holding the selected options (`string[]`); also the URL param. */
  key: Key;
  /** Label inside its group, e.g. "Zone". */
  label: string;
  /** Label without group context; active chips render `${standaloneLabel} ${option}`. */
  standaloneLabel: string;
  group: Group;
  /** String card field matched case-insensitively against the selection. */
  cardField: string;
  options: readonly string[];
}

export interface GameFilterGroupDescriptor<Group extends string = string> {
  id: Group;
  label: string;
}

export interface GameColorFacetOption {
  /** Stored card value (`cards.color`), lowercase. */
  value: string;
  label: string;
  /** HSL triplet (e.g. `"0 84% 60%"`) for chips/swatches. */
  swatch: string;
}

/**
 * Which facet pickers the gallery shows for a game. Type, rarity and set pickers are always shown.
 * UI reads this (Phase 3 wave B); `filters` keys for hidden facets are simply never set.
 */
export interface GameFacetDefinition {
  /** UVS symbol + attuned pickers (`filters.symbols` / `attuned`, `cards.symbols`). */
  symbols: boolean;
  /** Zone pickers from `GameFilterDefinition.zones`. */
  zones: boolean;
  /** Keyword picker (`filters.keywords`, `cards.keywords`). */
  keywords: boolean;
  /** UVS-only toggles: has attack/block, is character, ability timing, dual-faced. */
  uvsCardFlags: boolean;
  /** Color picker options (`cards.color`); omitted = no color facet. */
  colors?: readonly GameColorFacetOption[];
  /** Tag picker (`cards.tags`, pipe-delimited). */
  tags: boolean;
}

export interface GameFilterDefinition {
  /** Facet pickers shown in the gallery filters. */
  facets: GameFacetDefinition;
  /** Display order of the stat filter groups. */
  groups: readonly GameFilterGroupDescriptor[];
  /** Display order (within groups, and for active chips). */
  stats: readonly GameStatFilterDescriptor[];
  /** Display order (within groups, and for active chips). Rendered before a group's stats. */
  zones: readonly GameZoneFilterDescriptor[];
  /** URL write order for stat/range params (legacy; must list every stat key). */
  statParamOrder: readonly string[];
  /** URL write order for zone params (legacy; must list every zone key). */
  zoneParamOrder: readonly string[];
  /**
   * Fixed keyword picker options (UVS: its curated keyword list). Omitted = the distinct keywords
   * found in the catalog (`cards.keywords`, pipe-delimited, `Name: n` suffixes dropped).
   */
  keywordOptions?: readonly string[];
}

export interface GameFilterGroupLayout {
  id: string;
  label: string;
  zones: GameZoneFilterDescriptor[];
  stats: GameStatFilterDescriptor[];
}

export function getFilterGroupLayout(definition: GameFilterDefinition): GameFilterGroupLayout[] {
  return definition.groups.map((group) => ({
    id: group.id,
    label: group.label,
    zones: definition.zones.filter((zone) => zone.group === group.id),
    stats: definition.stats.filter((stat) => stat.group === group.id),
  }));
}

export function statStandaloneLabel(stat: GameStatFilterDescriptor): string {
  return stat.standaloneLabel ?? stat.label;
}

/** `[keyMin, keyMax, ...]` in `statParamOrder`. */
export function statRangeParamKeys(definition: GameFilterDefinition): string[] {
  return definition.statParamOrder.flatMap((key) => [`${key}Min`, `${key}Max`]);
}

/** Every filters key owned by the stats page (stat rules + zones). */
export function statPageFilterKeys(definition: GameFilterDefinition): string[] {
  return [...definition.statParamOrder, ...definition.zoneParamOrder];
}

type FilterRecord = Readonly<Record<string, unknown>>;

function readNumber(source: object, field: string): number | undefined {
  return (source as FilterRecord)[field] as number | undefined;
}

/** Stat rules with a value plus every selected zone option. */
export function countActiveStatPageFilters(definition: GameFilterDefinition, filters: object): number {
  const record = filters as FilterRecord;
  let count = 0;
  for (const stat of definition.stats) {
    const value = record[stat.key];
    if (value && typeof value === "object" && "value" in value && value.value !== undefined) count += 1;
  }
  for (const zone of definition.zones) {
    count += (record[zone.key] as string[] | undefined)?.length ?? 0;
  }
  return count;
}

/** Number of stats whose (badge-counted) range is set. */
export function countActiveStatRanges(definition: GameFilterDefinition, filters: object): number {
  let count = 0;
  for (const stat of definition.stats) {
    if (!stat.rangeCountsAsActive) continue;
    if (readNumber(filters, `${stat.key}Min`) !== undefined || readNumber(filters, `${stat.key}Max`) !== undefined) {
      count += 1;
    }
  }
  return count;
}

export function matchesStatFilter(cardValue: number | undefined, filter: StatFilterValue | undefined): boolean {
  if (!filter) return true;
  if (cardValue === undefined) return false;

  const { operator, value } = filter;
  switch (operator) {
    case "eq":
      return cardValue === value;
    case "neq":
      return cardValue !== value;
    case "gt":
      return cardValue > value;
    case "lt":
      return cardValue < value;
    case "gte":
      return cardValue >= value;
    case "lte":
      return cardValue <= value;
    default:
      return true;
  }
}

/**
 * Compiles the stat/range/zone part of `filters` into a card predicate, or `null` when none of
 * those filters are active. Semantics: a range or rule excludes cards missing the field.
 */
export function compileStatZoneFilter(
  definition: GameFilterDefinition,
  filters: object,
): ((card: object) => boolean) | null {
  const record = filters as FilterRecord;
  const checks: Array<(card: object) => boolean> = [];

  for (const stat of definition.stats) {
    if (!stat.applyRange) continue;
    const min = readNumber(filters, `${stat.key}Min`);
    const max = readNumber(filters, `${stat.key}Max`);
    if (min === undefined && max === undefined) continue;
    const field = stat.cardField;
    checks.push((card) => {
      const value = readNumber(card, field);
      if (value === undefined) return false;
      if (min !== undefined && value < min) return false;
      if (max !== undefined && value > max) return false;
      return true;
    });
  }

  for (const zone of definition.zones) {
    const selected = record[zone.key] as string[] | undefined;
    if (!selected || selected.length === 0) continue;
    const lower = selected.map((z) => z.toLowerCase());
    const field = zone.cardField;
    checks.push((card) => {
      const value = (card as FilterRecord)[field];
      return typeof value === "string" && value !== "" && lower.includes(value.toLowerCase());
    });
  }

  for (const stat of definition.stats) {
    const rule = record[stat.key] as StatFilterValue | undefined;
    if (!rule) continue;
    const field = stat.cardField;
    checks.push((card) => matchesStatFilter(readNumber(card, field), rule));
  }

  if (checks.length === 0) return null;
  return (card) => {
    for (const check of checks) {
      if (!check(card)) return false;
    }
    return true;
  };
}

/** Facet array fields of the persisted filters shape (`filters.colors` / `filters.tags`). */
export interface FacetFilterFields {
  /** Selected colors (`cards.color`, lowercase option values); a card matches any. */
  colors?: string[];
  /** Selected tags (`cards.tags`, pipe-delimited); a card matches any (case-insensitive). */
  tags?: string[];
}

/** Trimmed, non-empty parts of a pipe-delimited card field (`"A|B "` → `["A", "B"]`). */
export function splitPipeList(value: string | null | undefined): string[] {
  if (!value) return [];
  const out: string[] = [];
  for (const part of value.split("|")) {
    const trimmed = part.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

/**
 * Compiles the color/tag facet part of `filters` into a card predicate, or `null` when none is
 * active. Only facets the definition declares (`facets.colors`, `facets.tags`) apply.
 */
export function compileFacetFilter(
  definition: GameFilterDefinition,
  filters: object,
): ((card: object) => boolean) | null {
  const record = filters as FilterRecord;
  const checks: Array<(card: object) => boolean> = [];

  const colors = record.colors as string[] | undefined;
  if (definition.facets.colors && colors && colors.length > 0) {
    const wanted = new Set(colors.map((c) => c.trim().toLowerCase()));
    checks.push((card) => {
      const value = (card as FilterRecord).color;
      return typeof value === "string" && wanted.has(value.trim().toLowerCase());
    });
  }

  const tags = record.tags as string[] | undefined;
  if (definition.facets.tags && tags && tags.length > 0) {
    const wanted = new Set(tags.map((t) => t.trim().toLowerCase()));
    checks.push((card) => {
      const value = (card as FilterRecord).tags;
      if (typeof value !== "string") return false;
      return splitPipeList(value).some((tag) => wanted.has(tag.toLowerCase()));
    });
  }

  if (checks.length === 0) return null;
  return (card) => {
    for (const check of checks) {
      if (!check(card)) return false;
    }
    return true;
  };
}

/** Numeric comparator for a sortable stat key, or `null` if `field` is not a sortable stat. */
export function getStatSortComparator(
  definition: GameFilterDefinition,
  field: string,
  multiplier: number,
): ((a: object, b: object) => number) | null {
  const stat = definition.stats.find((s) => s.sortable && s.key === field);
  if (!stat) return null;
  const cardField = stat.cardField;
  return (a, b) => ((readNumber(a, cardField) ?? 0) - (readNumber(b, cardField) ?? 0)) * multiplier;
}
