import type { Doc } from "../../../convex/_generated/dataModel";
import type { GameId } from "@shared/games/types";
import { catalogDbName, deleteLegacyDatabaseOnce } from "@/lib/storage-keys";
import { dedupeRarityOptions } from "./rarity";
import { UVS_KEYWORD_LIST } from "@shared/games/uvs/keywords";
import { splitPipeList, type GameFilterDefinition } from "@shared/games/filters";

export type CachedCard = Doc<"cards">;

export const CARD_CACHE_SCHEMA_VERSION = 2;

export function isGalleryCatalogCard(card: Pick<CachedCard, "isFrontFace" | "isVariant">): boolean {
  return card.isFrontFace !== false && card.isVariant !== true;
}

export const KEYWORD_LIST = UVS_KEYWORD_LIST;

export type Keyword = (typeof KEYWORD_LIST)[number];

export interface CardCacheMetadata {
  version: number;
  updatedAt: number;
  cardCount: number;
  lastSyncAt: number;
  schemaVersion?: number;
}

const LEGACY_DB_NAME = "universus-cards";
const STORE_NAME = "cards";
const METADATA_KEY = "cache-metadata";
const CARDS_KEY = "cards-data";

const cardStorePromises = new Map<GameId, Promise<ReturnType<typeof import("idb-keyval").createStore>>>();

async function getCardStore(game: GameId) {
  if (typeof window === "undefined") return null;
  
  let storePromise = cardStorePromises.get(game);
  if (!storePromise) {
    // Pre multi-game DB; the catalog re-downloads into the per-game DB instead.
    deleteLegacyDatabaseOnce(LEGACY_DB_NAME);
    storePromise = import("idb-keyval").then(({ createStore }) => {
      return createStore(catalogDbName(game, "cards"), STORE_NAME);
    });
    cardStorePromises.set(game, storePromise);
  }

  return storePromise;
}

export async function getCacheMetadata(game: GameId): Promise<CardCacheMetadata | null> {
  const store = await getCardStore(game);
  if (!store) return null;
  
  try {
    const { get } = await import("idb-keyval");
    const metadata = await get<CardCacheMetadata>(METADATA_KEY, store);
    return metadata ?? null;
  } catch {
    return null;
  }
}

export async function setCacheMetadata(game: GameId, metadata: CardCacheMetadata): Promise<void> {
  const store = await getCardStore(game);
  if (!store) return;
  
  try {
    const { set } = await import("idb-keyval");
    await set(METADATA_KEY, metadata, store);
  } catch (error) {
    console.error("Failed to save cache metadata:", error);
  }
}

export async function getCachedCards(game: GameId): Promise<CachedCard[]> {
  const store = await getCardStore(game);
  if (!store) return [];
  
  try {
    const { get } = await import("idb-keyval");
    const cards = await get<CachedCard[]>(CARDS_KEY, store);
    return cards ?? [];
  } catch {
    return [];
  }
}

export async function setCachedCards(game: GameId, cards: CachedCard[]): Promise<void> {
  const store = await getCardStore(game);
  if (!store) return;
  
  try {
    const { set } = await import("idb-keyval");
    await set(CARDS_KEY, cards, store);
  } catch (error) {
    console.error("Failed to save cards to cache:", error);
  }
}

export async function appendCachedCards(game: GameId, newCards: CachedCard[]): Promise<CachedCard[]> {
  const store = await getCardStore(game);
  if (!store) return newCards;
  
  try {
    const { set } = await import("idb-keyval");
    const existingCards = await getCachedCards(game);
    const existingIds = new Set(existingCards.map(c => c._id));
    const uniqueNewCards = newCards.filter(c => !existingIds.has(c._id));
    const allCards = [...existingCards, ...uniqueNewCards];
    await set(CARDS_KEY, allCards, store);
    return allCards;
  } catch (error) {
    console.error("Failed to append cards to cache:", error);
    return newCards;
  }
}

export async function clearCardCache(game: GameId): Promise<void> {
  const store = await getCardStore(game);
  if (!store) return;
  
  try {
    const { del } = await import("idb-keyval");
    await del(METADATA_KEY, store);
    await del(CARDS_KEY, store);
  } catch (error) {
    console.error("Failed to clear card cache:", error);
  }
}

export async function isCacheValid(game: GameId, serverVersion: number | null): Promise<boolean> {
  if (serverVersion === null) return false;
  const metadata = await getCacheMetadata(game);
  if (!metadata) return false;
  return metadata.version === serverVersion;
}

export async function getCacheStats(game: GameId): Promise<{
  hasCache: boolean;
  version: number | null;
  cardCount: number;
  lastSyncAt: number | null;
}> {
  const metadata = await getCacheMetadata(game);
  const cards = await getCachedCards(game);
  
  return {
    hasCache: metadata !== null && cards.length > 0,
    version: metadata?.version ?? null,
    cardCount: cards.length,
    lastSyncAt: metadata?.lastSyncAt ?? null,
  };
}

export interface CardIndex {
  byId: Map<string, CachedCard>;
  byName: Map<string, CachedCard[]>;
  byType: Map<string, CachedCard[]>;
  byRarity: Map<string, CachedCard[]>;
  bySetCode: Map<string, CachedCard[]>;
  bySetName: Map<string, CachedCard[]>;
}

export function buildCardIndex(
  galleryCards: CachedCard[],
  companionCards: CachedCard[] = []
): CardIndex {
  const index: CardIndex = {
    byId: new Map(),
    byName: new Map(),
    byType: new Map(),
    byRarity: new Map(),
    bySetCode: new Map(),
    bySetName: new Map(),
  };

  for (const card of galleryCards) {
    index.byId.set(card._id, card);

    const nameLower = card.name.toLowerCase();
    if (!index.byName.has(nameLower)) {
      index.byName.set(nameLower, []);
    }
    index.byName.get(nameLower)!.push(card);

    if (card.type) {
      if (!index.byType.has(card.type)) {
        index.byType.set(card.type, []);
      }
      index.byType.get(card.type)!.push(card);
    }

    if (card.rarity) {
      if (!index.byRarity.has(card.rarity)) {
        index.byRarity.set(card.rarity, []);
      }
      index.byRarity.get(card.rarity)!.push(card);
    }

    if (card.setCode) {
      if (!index.bySetCode.has(card.setCode)) {
        index.bySetCode.set(card.setCode, []);
      }
      index.bySetCode.get(card.setCode)!.push(card);
    }

    if (card.setName) {
      if (!index.bySetName.has(card.setName)) {
        index.bySetName.set(card.setName, []);
      }
      index.bySetName.get(card.setName)!.push(card);
    }
  }

  for (const card of companionCards) {
    index.byId.set(card._id, card);
  }

  return index;
}

export interface CatalogUniqueValues {
  types: string[];
  rarities: string[];
  setCodes: string[];
  setNames: string[];
  setNumbers: number[];
  keywords: string[];
  symbols: string[];
  /** Distinct `cards.tags` values (pipe-delimited), sorted. Empty for games without tags. */
  tags: string[];
  /** Distinct normalized (lowercase) `cards.color` values, sorted. */
  colors: string[];
}

/** Keyword name without a trailing value (`"Breaker: 2"` / `"Breaker 2"` → `"Breaker"`). */
function keywordName(keyword: string): string {
  return keyword.replace(/[:\s]+\d+$/, "").trim();
}

/**
 * Picker values for the gallery filters. `keywords` come from the game's fixed
 * `filterDefinition.keywordOptions` when set, else from the catalog.
 */
export function getUniqueValues(
  cards: CachedCard[],
  filterDefinition?: Pick<GameFilterDefinition, "keywordOptions">
): CatalogUniqueValues {
  const types = new Set<string>();
  const rarities = new Set<string>();
  const setData = new Map<string, { name: string; number: number }>();
  const symbols = new Set<string>();
  const tags = new Map<string, string>();
  const colors = new Set<string>();
  const fixedKeywords = filterDefinition ? filterDefinition.keywordOptions : UVS_KEYWORD_LIST;
  const catalogKeywords = fixedKeywords ? null : new Map<string, string>();

  for (const card of cards) {
    if (card.type) types.add(card.type);
    if (card.rarity) rarities.add(card.rarity);
    if (card.setCode && card.setName) {
      if (!setData.has(card.setCode)) {
        setData.set(card.setCode, { 
          name: card.setName, 
          number: card.setNumber ?? 0 
        });
      }
    }
    if (card.symbols) {
      card.symbols.split("|").forEach(s => symbols.add(s.trim()));
    }
    if (card.tags) {
      for (const tag of splitPipeList(card.tags)) {
        const key = tag.toLowerCase();
        if (!tags.has(key)) tags.set(key, tag);
      }
    }
    const color = card.color?.trim().toLowerCase();
    if (color) colors.add(color);
    if (catalogKeywords && card.keywords) {
      for (const raw of splitPipeList(card.keywords)) {
        const name = keywordName(raw);
        if (name && !catalogKeywords.has(name.toLowerCase())) catalogKeywords.set(name.toLowerCase(), name);
      }
    }
  }

  const sortedSets = Array.from(setData.entries())
    .sort((a, b) => (b[1].number ?? 0) - (a[1].number ?? 0));
  const byLabel = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

  return {
    types: Array.from(types).filter(t => t !== "Special").sort(),
    rarities: dedupeRarityOptions(rarities),
    setCodes: sortedSets.map(([code]) => code),
    setNames: sortedSets.map(([, data]) => data.name),
    setNumbers: sortedSets.map(([, data]) => data.number),
    keywords: fixedKeywords ? [...fixedKeywords] : Array.from(catalogKeywords!.values()).sort(byLabel),
    symbols: Array.from(symbols).sort(),
    tags: Array.from(tags.values()).sort(byLabel),
    colors: Array.from(colors).sort(),
  };
}

export function cardHasKeyword(card: CachedCard, keyword: string): boolean {
  if (!card.keywords) return false;
  const cardKeywords = card.keywords.split("|").map(kw => kw.trim());
  return cardKeywords.some(kw => kw === keyword || kw.startsWith(`${keyword}:`));
}

export function cardHasSymbol(card: CachedCard, symbol: string): boolean {
  if (!card.symbols) return false;
  const cardSymbols = card.symbols.split("|").map(s => s.trim());
  return cardSymbols.some(s => s.toLowerCase() === symbol.toLowerCase());
} 