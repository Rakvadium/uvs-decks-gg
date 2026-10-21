// Stored labels follow the dominant catalog spelling (Common/Uncommon/Rare/Ultra/Secret/Promo);
// src/lib/universus/rarity.ts canonicalizes these for gallery filters.
const PRINTED_RARITY_LABELS: Record<string, string> = {
  C: "Common",
  COMMON: "Common",
  U: "Uncommon",
  UC: "Uncommon",
  UNCOMMON: "Uncommon",
  R: "Rare",
  RARE: "Rare",
  UR: "Ultra",
  ULTRA: "Ultra",
  "ULTRA RARE": "Ultra",
  SR: "Secret",
  SE: "Secret",
  SECRET: "Secret",
  "SECRET RARE": "Secret",
  CR: "Character Rare",
  P: "Promo",
  PR: "Promo",
  PROMO: "Promo",
};

const CHARACTER_PREFIX_RE = /^(?:CH|CHARACTER)(?:[\s-]+(.+))?$/;

/**
 * Maps a printed rarity code or OCR'd label to the stored rarity.
 * Characters print "CH" alone (stored as "Character") or "CH-<code>" (stored as that code's rarity).
 */
export function printedRarityLabel(raw: string | undefined | null): string | undefined {
  const key = raw?.trim().replace(/\s+/g, " ").toUpperCase();
  if (!key) return undefined;
  const character = key.match(CHARACTER_PREFIX_RE);
  if (character) {
    return character[1] ? PRINTED_RARITY_LABELS[character[1]] : "Character";
  }
  return PRINTED_RARITY_LABELS[key];
}

const FILE_NAME_RARITY_CODE_RE = /^(?:C|U|UC|R|UR|SR|SE|CR|P|PR|CH)$/i;

/** Rarity code segment of a scan file name, e.g. "UR" or "CH" in "FT01-001-CH-R-CanaAlberona.png". */
export function isFileNameRarityCode(segment: string): boolean {
  return FILE_NAME_RARITY_CODE_RE.test(segment);
}
