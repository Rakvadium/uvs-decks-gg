const RARITY_TYPE_LEAKAGE = new Set([
  "CHARACTER",
  "TOKEN",
  "SPECIAL",
  "ATTACK",
  "ACTION",
  "ASSET",
  "FOUNDATION",
  "ARENA",
  "BACKUP",
]);

const RARITY_ALIASES: Record<string, string> = {
  C: "Common",
  COMMON: "Common",
  UC: "Uncommon",
  UNCOMMON: "Uncommon",
  R: "Rare",
  RARE: "Rare",
  SR: "Super Rare",
  "SUPER RARE": "Super Rare",
  SUPERRARE: "Super Rare",
  UR: "Ultra Rare",
  ULTRA: "Ultra Rare",
  "ULTRA RARE": "Ultra Rare",
  ULTRARARE: "Ultra Rare",
  SE: "Secret Rare",
  SECRET: "Secret Rare",
  "SECRET RARE": "Secret Rare",
  SECRETRARE: "Secret Rare",
  CR: "Character Rare",
  "CHARACTER RARE": "Character Rare",
  CHARACTERRARE: "Character Rare",
  CH: "Champion",
  CHAMPION: "Champion",
  P: "Promo",
  PROMO: "Promo",
};

function rarityKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function titleCaseWords(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function canonicalizeRarity(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const key = rarityKey(trimmed);
  if (RARITY_TYPE_LEAKAGE.has(key)) return null;

  return RARITY_ALIASES[key] ?? titleCaseWords(trimmed);
}

export function dedupeRarityOptions(values: Iterable<string>): string[] {
  const byKey = new Map<string, string>();

  for (const value of values) {
    const canonical = canonicalizeRarity(value);
    if (!canonical) continue;
    const key = rarityKey(canonical);
    if (!byKey.has(key)) {
      byKey.set(key, canonical);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
}

export function cardMatchesRarityFilter(
  cardRarity: string | undefined | null,
  selected: string[] | undefined
): boolean {
  if (!selected || selected.length === 0) return true;
  if (!cardRarity) return false;

  const cardCanonical = canonicalizeRarity(cardRarity);
  if (!cardCanonical) return false;

  return selected.some((value) => canonicalizeRarity(value) === cardCanonical);
}

export function rarityFilterSelected(
  selected: string[] | undefined,
  option: string
): boolean {
  if (!selected || selected.length === 0) return false;
  const optionCanonical = canonicalizeRarity(option);
  if (!optionCanonical) return false;
  return selected.some((value) => canonicalizeRarity(value) === optionCanonical);
}

export function toggleCanonicalRarityFilter(
  selected: string[] | undefined,
  option: string
): string[] | undefined {
  const optionCanonical = canonicalizeRarity(option);
  if (!optionCanonical) {
    return selected && selected.length > 0 ? selected : undefined;
  }

  const current = selected ?? [];
  const isSelected = current.some(
    (value) => canonicalizeRarity(value) === optionCanonical
  );

  if (isSelected) {
    const next = current.filter(
      (value) => canonicalizeRarity(value) !== optionCanonical
    );
    return next.length > 0 ? next : undefined;
  }

  const withoutAliases = current.filter(
    (value) => canonicalizeRarity(value) !== optionCanonical
  );
  return [...withoutAliases, optionCanonical];
}
