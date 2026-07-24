import type { CardFilters, GalleryViewMode, StatFilterValue, StatOperator } from "@/providers/UIStateProvider";

export type GallerySearchMode = "name" | "text" | "all";
export type GalleryUiViewMode = "card" | "list" | "details";

export interface GalleryUrlState {
  search: string;
  searchMode: GallerySearchMode;
  filters: CardFilters;
  viewMode: GalleryUiViewMode;
  sortField: string;
  sortDirection: "asc" | "desc";
}

const ARRAY_KEYS = [
  "rarity",
  "type",
  "set",
  "symbols",
  "attuned",
  "keywords",
  "attackZone",
  "blockZone",
  "abilityTiming",
] as const;

const BOOL_KEYS = [
  "symbolMatchAll",
  "keywordMatchAll",
  "includeInfinity",
  "hasAttack",
  "hasBlock",
  "isCharacter",
  "hasAbilities",
  "isDualFaced",
  "isReleased",
] as const;

const NUMBER_KEYS = [
  "difficultyMin",
  "difficultyMax",
  "controlMin",
  "controlMax",
  "speedMin",
  "speedMax",
  "damageMin",
  "damageMax",
  "blockModifierMin",
  "blockModifierMax",
  "handSizeMin",
  "handSizeMax",
  "healthMin",
  "healthMax",
  "staminaMin",
  "staminaMax",
] as const;

const STAT_KEYS = [
  "difficulty",
  "control",
  "speed",
  "damage",
  "blockModifier",
  "handSize",
  "health",
  "stamina",
] as const;

const STAT_OPERATORS = new Set<StatOperator>(["eq", "neq", "gt", "lt", "gte", "lte"]);

const GALLERY_PARAM_KEYS = new Set([
  "q",
  "sm",
  "view",
  "sort",
  "dir",
  "format",
  ...ARRAY_KEYS,
  ...BOOL_KEYS,
  ...NUMBER_KEYS,
  ...STAT_KEYS,
]);

function parseCsv(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function parseBool(value: string | null): boolean | undefined {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

function parseNumber(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStat(value: string | null): StatFilterValue | undefined {
  if (!value) return undefined;
  const [operatorRaw, amountRaw] = value.split(":");
  if (!operatorRaw || amountRaw == null || amountRaw === "") return undefined;
  if (!STAT_OPERATORS.has(operatorRaw as StatOperator)) return undefined;
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) return undefined;
  return { operator: operatorRaw as StatOperator, value: amount };
}

function serializeStat(value: StatFilterValue | undefined): string | undefined {
  if (!value) return undefined;
  return `${value.operator}:${value.value}`;
}

export function galleryUrlHasState(params: URLSearchParams): boolean {
  for (const key of params.keys()) {
    if (GALLERY_PARAM_KEYS.has(key)) return true;
  }
  return false;
}

export function parseGalleryUrlState(params: URLSearchParams): Partial<GalleryUrlState> {
  const result: Partial<GalleryUrlState> = {};
  const search = params.get("q");
  if (search != null) result.search = search;

  const searchMode = params.get("sm");
  if (searchMode === "name" || searchMode === "text" || searchMode === "all") {
    result.searchMode = searchMode;
  }

  const view = params.get("view");
  if (view === "card" || view === "list" || view === "details" || view === "grid") {
    result.viewMode = view === "grid" ? "card" : view;
  }

  const sortField = params.get("sort");
  if (sortField) result.sortField = sortField;

  const sortDirection = params.get("dir");
  if (sortDirection === "asc" || sortDirection === "desc") {
    result.sortDirection = sortDirection;
  }

  const filters: CardFilters = {};
  const format = params.get("format");
  if (format) filters.format = format;

  for (const key of ARRAY_KEYS) {
    const value = parseCsv(params.get(key));
    if (value) filters[key] = value;
  }

  for (const key of BOOL_KEYS) {
    const value = parseBool(params.get(key));
    if (value !== undefined) filters[key] = value;
  }

  for (const key of NUMBER_KEYS) {
    const value = parseNumber(params.get(key));
    if (value !== undefined) filters[key] = value;
  }

  for (const key of STAT_KEYS) {
    const value = parseStat(params.get(key));
    if (value) filters[key] = value;
  }

  if (Object.keys(filters).length > 0) {
    result.filters = filters;
  }

  return result;
}

export function writeGalleryUrlState(
  params: URLSearchParams,
  state: {
    search: string;
    searchMode: GallerySearchMode;
    filters: CardFilters;
    viewMode: GalleryUiViewMode;
    sortField?: string;
    sortDirection?: "asc" | "desc";
    defaultFormatKey?: string;
  }
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  for (const key of GALLERY_PARAM_KEYS) {
    next.delete(key);
  }

  const trimmedSearch = state.search.trim();
  if (trimmedSearch) next.set("q", trimmedSearch);
  if (state.searchMode !== "all") next.set("sm", state.searchMode);
  if (state.viewMode !== "card") next.set("view", state.viewMode);
  if (state.sortField && state.sortField !== "default") next.set("sort", state.sortField);
  if (state.sortDirection && state.sortDirection !== "asc") next.set("dir", state.sortDirection);

  const { filters } = state;
  if (filters.format && filters.format !== state.defaultFormatKey) {
    next.set("format", filters.format);
  }

  for (const key of ARRAY_KEYS) {
    const value = filters[key];
    if (value && value.length > 0) next.set(key, value.join(","));
  }

  for (const key of BOOL_KEYS) {
    const value = filters[key];
    if (value === undefined) continue;
    if (key === "includeInfinity" && value === true) continue;
    if (key !== "includeInfinity" && value === false) continue;
    next.set(key, value ? "1" : "0");
  }

  for (const key of NUMBER_KEYS) {
    const value = filters[key];
    if (value !== undefined) next.set(key, String(value));
  }

  for (const key of STAT_KEYS) {
    const serialized = serializeStat(filters[key]);
    if (serialized) next.set(key, serialized);
  }

  return next;
}

export function toGalleryViewMode(mode: GalleryUiViewMode): GalleryViewMode {
  return mode === "card" ? "grid" : mode;
}

export function fromGalleryViewMode(mode: GalleryViewMode | undefined): GalleryUiViewMode {
  if (mode === "list" || mode === "details") return mode;
  return "card";
}

export function stripSearchFields(filters: CardFilters): CardFilters {
  const next = { ...filters };
  delete next.search;
  delete next.searchMode;
  return next;
}
