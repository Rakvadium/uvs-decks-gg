import type { CachedCard } from "@/lib/universus/card-store";

export type DeckViewMode = "stacked" | "list";
export type DeckListSortKey =
  | "difficulty"
  | "control"
  | "blockModifier"
  | "attackSpeed"
  | "attackDamage"
  | "blockZone"
  | "attackZone";

export type ListSortDirection = "asc" | "desc";

export const LIST_VIEW_GROUPS: { key: string; label: string; column: "left" | "right" }[] = [
  { key: "Character", label: "Characters", column: "left" },
  { key: "Foundation", label: "Foundations", column: "left" },
  { key: "Attack", label: "Attacks", column: "right" },
  { key: "Action", label: "Actions", column: "right" },
  { key: "Asset", label: "Assets", column: "right" },
  { key: "Backup", label: "Backups", column: "right" },
  { key: "Other", label: "Other", column: "right" },
];

export const LIST_SORT_OPTIONS: { value: DeckListSortKey; label: string }[] = [
  { value: "difficulty", label: "Difficulty" },
  { value: "control", label: "Control Check" },
  { value: "blockModifier", label: "Block Modifier" },
  { value: "attackSpeed", label: "Attack Speed" },
  { value: "attackDamage", label: "Attack Damage" },
  { value: "blockZone", label: "Block Zone" },
  { value: "attackZone", label: "Attack Zone" },
];

export type DeckListSortSelectValue = `${DeckListSortKey}:${ListSortDirection}`;

export type DeckListSortSelectOption = {
  value: DeckListSortSelectValue;
  key: DeckListSortKey;
  direction: ListSortDirection;
  label: string;
};

export type DeckListEntry = {
  card: CachedCard;
  quantity: number;
  backCard?: CachedCard | null;
  typeKey: string;
};

export type DeckEntryWithQuantity = {
  card: CachedCard;
  quantity: number;
};

export function supportsListSortDirection(sortKey: DeckListSortKey) {
  return sortKey !== "blockZone" && sortKey !== "attackZone";
}

export const LIST_SORT_SELECT_OPTIONS: DeckListSortSelectOption[] = (() => {
  const options: DeckListSortSelectOption[] = [];
  for (const option of LIST_SORT_OPTIONS) {
    if (!supportsListSortDirection(option.value)) {
      options.push({
        value: `${option.value}:asc` as DeckListSortSelectValue,
        key: option.value,
        direction: "asc",
        label: option.label,
      });
      continue;
    }

    options.push(
      {
        value: `${option.value}:asc` as DeckListSortSelectValue,
        key: option.value,
        direction: "asc",
        label: `${option.label} (Low to High)`,
      },
      {
        value: `${option.value}:desc` as DeckListSortSelectValue,
        key: option.value,
        direction: "desc",
        label: `${option.label} (High to Low)`,
      }
    );
  }
  return options;
})();

export const VIEW_MODE_OPTIONS: { value: DeckViewMode; label: string }[] = [
  { value: "stacked", label: "Stacked" },
  { value: "list", label: "List" },
];

function getNumericValue(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function compareNumeric(a: number | null, b: number | null, direction: ListSortDirection) {
  const aHas = a !== null;
  const bHas = b !== null;
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  if (!aHas && !bHas) return 0;
  if (direction === "asc") return (a ?? 0) - (b ?? 0);
  return (b ?? 0) - (a ?? 0);
}

function compareDifficulty(a: CachedCard, b: CachedCard) {
  const aDifficulty = getNumericValue(a.difficulty);
  const bDifficulty = getNumericValue(b.difficulty);
  return compareNumeric(aDifficulty, bDifficulty, "asc");
}

function compareAlphabetical(a: CachedCard, b: CachedCard) {
  return (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
}

function normalizeZoneValue(zone?: string | null) {
  if (!zone) return null;
  const normalized = zone.toLowerCase();
  if (normalized.startsWith("l")) return 0;
  if (normalized.startsWith("m")) return 1;
  if (normalized.startsWith("h")) return 2;
  return null;
}

export function getZoneTone(zone?: string | null) {
  const value = normalizeZoneValue(zone);
  if (value === 0) return "low";
  if (value === 1) return "mid";
  if (value === 2) return "high";
  return null;
}

function compareZone(a?: string | null, b?: string | null) {
  const aValue = normalizeZoneValue(a);
  const bValue = normalizeZoneValue(b);
  const aHas = aValue !== null;
  const bHas = bValue !== null;
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  if (!aHas && !bHas) return 0;
  return (aValue ?? 0) - (bValue ?? 0);
}

export function getZoneTintClass(tone: "low" | "mid" | "high" | null) {
  if (tone === "low") return "bg-yellow-500/10";
  if (tone === "mid") return "bg-orange-500/10";
  if (tone === "high") return "bg-red-500/10";
  return "";
}

export function sortListEntries(
  entries: DeckListEntry[],
  sortKey: DeckListSortKey,
  direction: ListSortDirection,
  typeKey: string
) {
  const isAttackType = typeKey === "Attack";

  return [...entries].sort((aEntry, bEntry) => {
    const a = aEntry.card;
    const b = bEntry.card;
    let primary = 0;

    switch (sortKey) {
      case "difficulty":
        primary = compareNumeric(getNumericValue(a.difficulty), getNumericValue(b.difficulty), direction);
        if (primary !== 0) return primary;
        return compareAlphabetical(a, b);
      case "control":
        primary = compareNumeric(getNumericValue(a.control), getNumericValue(b.control), direction);
        break;
      case "blockModifier":
        primary = compareNumeric(getNumericValue(a.blockModifier), getNumericValue(b.blockModifier), direction);
        break;
      case "attackSpeed":
        if (isAttackType) {
          primary = compareNumeric(getNumericValue(a.speed), getNumericValue(b.speed), direction);
        }
        break;
      case "attackDamage":
        if (isAttackType) {
          primary = compareNumeric(getNumericValue(a.damage), getNumericValue(b.damage), direction);
        }
        break;
      case "blockZone":
        primary = compareZone(a.blockZone, b.blockZone);
        break;
      case "attackZone":
        if (isAttackType) {
          primary = compareZone(a.attackZone, b.attackZone);
        }
        break;
      default:
        break;
    }

    if (primary !== 0) return primary;
    const difficultyCompare = compareDifficulty(a, b);
    if (difficultyCompare !== 0) return difficultyCompare;
    return compareAlphabetical(a, b);
  });
}

export function buildDeckEntriesFromQuantities(
  quantities: Record<string, number>,
  cardMap: Map<string, CachedCard>
): DeckEntryWithQuantity[] {
  const entries: DeckEntryWithQuantity[] = [];
  for (const [cardId, quantity] of Object.entries(quantities)) {
    if (quantity <= 0) continue;
    const card = cardMap.get(cardId);
    if (!card) continue;
    entries.push({ card, quantity });
  }
  return entries;
}

export function extractZones(rawZone?: string | null): string[] {
  if (!rawZone) return [];
  const tokens = rawZone
    .toLowerCase()
    .split(/[\s,/|]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const zones = new Set<string>();
  for (const token of tokens) {
    if (token.startsWith("h")) zones.add("High");
    if (token.startsWith("m")) zones.add("Mid");
    if (token.startsWith("l")) zones.add("Low");
  }
  return Array.from(zones);
}

export function toSortedBuckets(record: Record<string, number>) {
  return Object.entries(record)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
