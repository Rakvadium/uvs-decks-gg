/**
 * Pure normalizer for Cyberpunk TCG card records from the official card database
 * (https://cyberpunktcg.com/cards, powered by the Netdeck.gg API). No I/O here so it can be unit
 * tested; scripts/import-cyberpunk-official.ts does the fetching/uploading.
 *
 * Output rows match `cardInputValidator` (convex/validators.ts) / `pickUpsertCard`
 * (convex/adminHttp.ts). See docs/games/cyberpunk.md "Card data model".
 */

export const CYBERPUNK_GAME_ID = "cyberpunk";

export type OfficialSetRef = { code: string; name: string };

export type OfficialPrinting = {
  id: string;
  collector_number: string | null;
  image_url: string | null;
  source_image_url: string | null;
  set: OfficialSetRef;
  rarity: string | null;
  finish?: string | null;
  artist: string | null;
  language: string;
  localized_name?: string | null;
  printed_rules_text?: string | null;
  official_rules_text?: string | null;
};

export type OfficialCard = {
  id: string;
  external_id?: string | null;
  name: string;
  subname: string | null;
  display_name: string | null;
  slug?: string | null;
  rules_text: string | null;
  official_rules_text_en?: string | null;
  language?: string | null;
  printing_id: string | null;
  color: string | null;
  card_type: string | null;
  is_eddiable: boolean | null;
  classifications: string[] | null;
  keywords: string[] | null;
  cost: number | null;
  power: number | null;
  ram: number | null;
  artist: string | null;
  printings: OfficialPrinting[];
  legalities?: Record<string, string> | null;
};

type SetInfo = { code: string; name: string; setNumber: number };

/**
 * Official set code → our short, stable set code. Our code is the `setCode` column and (lowercased)
 * the R2 folder `cards/<code>/`, so never change an entry once uploaded; add new sets at the end.
 * Beta printings are separate official sets (numbered `β001…`), so they get a `-B` suffix.
 */
export const OFFICIAL_SET_CODE_MAP: Record<string, SetInfo> = {
  welcometonightcityretail: { code: "WTNC", name: "Welcome to Night City", setNumber: 1 },
  welcometonightcitybeta: { code: "WTNC-B", name: "Welcome to Night City (Beta)", setNumber: 1.1 },
  embracingpowerretailstarterdeck: { code: "EP", name: "Embracing Power Starter Deck", setNumber: 2 },
  embracingpowerbetastarterdeck: { code: "EP-B", name: "Embracing Power Starter Deck (Beta)", setNumber: 2.1 },
  theheistretailstarterdeck: { code: "HEIST", name: "The Heist Starter Deck", setNumber: 3 },
  theheistbetastarterdeck: { code: "HEIST-B", name: "The Heist Starter Deck (Beta)", setNumber: 3.1 },
  boxtoppersretail: { code: "BT", name: "Box Toppers", setNumber: 4 },
  boxtoppersbeta: { code: "BT-B", name: "Box Toppers (Beta)", setNumber: 4.1 },
  prereleaseretail: { code: "PRE", name: "Pre-Release", setNumber: 5 },
  prereleasebeta: { code: "PRE-B", name: "Pre-Release (Beta)", setNumber: 5.1 },
  PRM01: { code: "PRM01", name: "Set 1 Promos", setNumber: 6 },
  arasakademodeck: { code: "DEMO-ARA", name: "Arasaka Demo Deck", setNumber: 7 },
  mercdemodeck: { code: "DEMO-MERC", name: "Merc Demo Deck", setNumber: 7.1 },
  edgerunneropens1: { code: "EO-S1", name: "Edgerunner Open S1", setNumber: 8 },
  nightcitybrawls1: { code: "NCB-S1", name: "Night City Brawl S1", setNumber: 8.1 },
  nightcityshowdowns1: { code: "NCS-S1", name: "Night City Showdown S1", setNumber: 8.2 },
};

/** Fallback for sets missing from the map: a sanitized upper-case official code (with a warning). */
function resolveSet(set: OfficialSetRef, warnings: string[]): SetInfo {
  const known = OFFICIAL_SET_CODE_MAP[set.code];
  if (known) return known;
  const code = set.code.toUpperCase().replace(/[^A-Z0-9_-]+/g, "-").slice(0, 32);
  warnings.push(`Unmapped official set "${set.code}" (${set.name}); using "${code}". Add it to OFFICIAL_SET_CODE_MAP.`);
  return { code, name: set.name, setNumber: 99 };
}

export type NormalizedCyberpunkCard = {
  oracleId: string;
  name: string;
  subname?: string;
  /** Omitted when the image could not be downloaded. */
  imageUrl?: string;
  isFrontFace: true;
  isVariant: boolean;
  setCode: string;
  setName: string;
  setNumber: number;
  collectorNumber: string;
  rarity?: string;
  type?: string;
  text?: string;
  keywords?: string;
  color?: string;
  cost?: number;
  power?: number;
  ram?: number;
  sellable?: boolean;
  tags?: string;
  artist?: string;
  legality?: string;
};

export type NormalizedCyberpunkSet = {
  code: string;
  name: string;
  setNumber: number;
  legality: string;
  officialCode: string;
  officialName: string;
};

/** Where to fetch a printing's image from and which R2 key it goes to. */
export type CyberpunkImageSource = {
  setCode: string;
  fileName: string;
  imageUrl: string;
  signedUrl?: string;
  sourceUrl?: string;
  /**
   * Community mirror (cyberpunktcg.wiki, one image per card by official slug) used when the
   * official CDN refuses the printing. Same art; alternate printings may differ in frame details.
   */
  fallbackUrl?: string;
};

export const CARD_IMAGE_MIRROR_BASE = "https://cyberpunktcg.wiki/images/cards";

export type NormalizeResult = {
  cards: NormalizedCyberpunkCard[];
  sets: NormalizedCyberpunkSet[];
  images: CyberpunkImageSource[];
  warnings: string[];
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function cleanNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function joinPipe(values: unknown): string | undefined {
  if (!Array.isArray(values)) return undefined;
  const parts = values.map(cleanString).filter((v): v is string => v !== undefined);
  return parts.length ? parts.join("|") : undefined;
}

/** Pure-digit collector numbers are zero-padded to 3 (the API has one stray "10" next to "009"). */
export function normalizeCollectorNumber(raw: string): string {
  const value = raw.trim();
  return /^\d{1,2}$/.test(value) ? value.padStart(3, "0") : value;
}

/** ASCII R2 file segment for a collector number: `β025` → `b025`, `005a` → `005a`. */
export function collectorFileSegment(collectorNumber: string): string {
  return collectorNumber
    .toLowerCase()
    .replace(/β/g, "b")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `display_name` ("V: Streetkid"), else `name — subname`, else `name`. */
export function cyberpunkCardName(card: Pick<OfficialCard, "name" | "subname" | "display_name">): string {
  const display = cleanString(card.display_name);
  if (display) return display;
  const name = cleanString(card.name) ?? "";
  const subname = cleanString(card.subname);
  return subname ? `${name} — ${subname}` : name;
}

/**
 * One row per English printing (French/other printings are skipped), deduped by printing id and by
 * `(setCode, collectorNumber)` (the upsert key in `admin.upsertCardsBatch`). `oracleId` is the
 * official card id shared across printings; the card's selected printing is the gallery row and
 * every other printing is `isVariant: true` (hidden from the default gallery).
 */
export function normalizeOfficialCards(items: OfficialCard[]): NormalizeResult {
  const warnings: string[] = [];
  const cards: NormalizedCyberpunkCard[] = [];
  const images: CyberpunkImageSource[] = [];
  const sets = new Map<string, NormalizedCyberpunkSet>();
  const seenPrintings = new Set<string>();
  const seenKeys = new Set<string>();
  const seenCards = new Set<string>();

  for (const card of items) {
    if (!card || typeof card.id !== "string" || seenCards.has(card.id)) continue;
    seenCards.add(card.id);

    const englishPrintings = (card.printings ?? []).filter((p) => p.language === "en");
    if (englishPrintings.length === 0) {
      warnings.push(`${card.id} (${card.name}) has no English printing; skipped`);
      continue;
    }
    const canonicalId = englishPrintings.some((p) => p.id === card.printing_id)
      ? card.printing_id
      : englishPrintings[0].id;

    const name = cyberpunkCardName(card);
    const text = cleanString(card.rules_text) ?? cleanString(card.official_rules_text_en);
    const color = cleanString(card.color)?.toLowerCase();
    const legality = card.legalities?.standard === "legal" ? "standard" : undefined;

    for (const printing of englishPrintings) {
      if (seenPrintings.has(printing.id)) continue;
      seenPrintings.add(printing.id);

      const rawCollector = cleanString(printing.collector_number);
      if (!rawCollector) {
        warnings.push(`${name} printing ${printing.id} has no collector number; skipped`);
        continue;
      }
      const set = resolveSet(printing.set, warnings);
      const collectorNumber = normalizeCollectorNumber(rawCollector);
      const key = `${set.code}#${collectorNumber}`;
      if (seenKeys.has(key)) {
        warnings.push(`Duplicate ${key} (${name}, printing ${printing.id}); skipped`);
        continue;
      }
      seenKeys.add(key);

      if (!sets.has(set.code)) {
        sets.set(set.code, {
          code: set.code,
          name: set.name,
          setNumber: set.setNumber,
          legality: "standard",
          officialCode: printing.set.code,
          officialName: printing.set.name,
        });
      }

      const setSegment = set.code.toLowerCase();
      const fileName = collectorFileSegment(collectorNumber);
      const imageUrl = `${setSegment}/${fileName}.webp`;

      cards.push({
        oracleId: card.id,
        name,
        subname: cleanString(card.subname),
        imageUrl,
        isFrontFace: true,
        isVariant: printing.id !== canonicalId,
        setCode: set.code,
        setName: set.name,
        setNumber: set.setNumber,
        collectorNumber,
        rarity: cleanString(printing.rarity) ?? undefined,
        type: cleanString(card.card_type),
        text,
        keywords: joinPipe(card.keywords),
        color,
        cost: cleanNumber(card.cost),
        power: cleanNumber(card.power),
        ram: cleanNumber(card.ram),
        sellable: typeof card.is_eddiable === "boolean" ? card.is_eddiable : undefined,
        tags: joinPipe(card.classifications),
        artist: cleanString(printing.artist) ?? cleanString(card.artist),
        legality,
      });
      images.push({
        setCode: setSegment,
        fileName,
        imageUrl,
        signedUrl: cleanString(printing.image_url),
        sourceUrl: cleanString(printing.source_image_url),
        fallbackUrl: cleanString(card.slug) ? `${CARD_IMAGE_MIRROR_BASE}/${cleanString(card.slug)}.webp` : undefined,
      });
    }
  }

  // Drop undefined keys so the JSON (and the upsert payload) stays minimal.
  const compactCards = cards.map(
    (c) => Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined)) as NormalizedCyberpunkCard,
  );
  const sortedSets = [...sets.values()].sort((a, b) => a.setNumber - b.setNumber);
  return { cards: compactCards, sets: sortedSets, images, warnings };
}
