import { get, set, del, createStore } from "idb-keyval";
import type { Doc } from "../../../convex/_generated/dataModel";

export type CachedCard = Doc<"cards">;

export interface CardCacheMetadata {
  version: number;
  updatedAt: number;
  cardCount: number;
  lastSyncAt: number;
}

const DB_NAME = "universus-cards";
const STORE_NAME = "cards";
const METADATA_KEY = "cache-metadata";
const CARDS_KEY = "cards-data";

const cardStore = typeof window !== "undefined" 
  ? createStore(DB_NAME, STORE_NAME)
  : null;

export async function getCacheMetadata(): Promise<CardCacheMetadata | null> {
  if (!cardStore) return null;
  try {
    const metadata = await get<CardCacheMetadata>(METADATA_KEY, cardStore);
    return metadata ?? null;
  } catch {
    return null;
  }
}

export async function setCacheMetadata(metadata: CardCacheMetadata): Promise<void> {
  if (!cardStore) return;
  try {
    await set(METADATA_KEY, metadata, cardStore);
  } catch (error) {
    console.error("Failed to save cache metadata:", error);
  }
}

export async function getCachedCards(): Promise<CachedCard[]> {
  if (!cardStore) return [];
  try {
    const cards = await get<CachedCard[]>(CARDS_KEY, cardStore);
    return cards ?? [];
  } catch {
    return [];
  }
}

export async function setCachedCards(cards: CachedCard[]): Promise<void> {
  if (!cardStore) return;
  try {
    await set(CARDS_KEY, cards, cardStore);
  } catch (error) {
    console.error("Failed to save cards to cache:", error);
  }
}

export async function appendCachedCards(newCards: CachedCard[]): Promise<CachedCard[]> {
  if (!cardStore) return newCards;
  try {
    const existingCards = await getCachedCards();
    const existingIds = new Set(existingCards.map(c => c._id));
    const uniqueNewCards = newCards.filter(c => !existingIds.has(c._id));
    const allCards = [...existingCards, ...uniqueNewCards];
    await set(CARDS_KEY, allCards, cardStore);
    return allCards;
  } catch (error) {
    console.error("Failed to append cards to cache:", error);
    return newCards;
  }
}

export async function clearCardCache(): Promise<void> {
  if (!cardStore) return;
  try {
    await del(METADATA_KEY, cardStore);
    await del(CARDS_KEY, cardStore);
  } catch (error) {
    console.error("Failed to clear card cache:", error);
  }
}

export async function isCacheValid(serverVersion: number | null): Promise<boolean> {
  if (serverVersion === null) return false;
  const metadata = await getCacheMetadata();
  if (!metadata) return false;
  return metadata.version === serverVersion;
}

export async function getCacheStats(): Promise<{
  hasCache: boolean;
  version: number | null;
  cardCount: number;
  lastSyncAt: number | null;
}> {
  const metadata = await getCacheMetadata();
  const cards = await getCachedCards();
  
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

export function buildCardIndex(cards: CachedCard[]): CardIndex {
  const index: CardIndex = {
    byId: new Map(),
    byName: new Map(),
    byType: new Map(),
    byRarity: new Map(),
    bySetCode: new Map(),
    bySetName: new Map(),
  };

  for (const card of cards) {
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

  return index;
}

export function getUniqueValues(cards: CachedCard[]): {
  types: string[];
  rarities: string[];
  setCodes: string[];
  setNames: string[];
  keywords: string[];
  symbols: string[];
} {
  const types = new Set<string>();
  const rarities = new Set<string>();
  const setCodes = new Set<string>();
  const setNames = new Set<string>();
  const keywords = new Set<string>();
  const symbols = new Set<string>();

  for (const card of cards) {
    if (card.type) types.add(card.type);
    if (card.rarity) rarities.add(card.rarity);
    if (card.setCode) setCodes.add(card.setCode);
    if (card.setName) setNames.add(card.setName);
    if (card.keywords) {
      card.keywords.split("|").forEach(kw => keywords.add(kw.trim()));
    }
    if (card.symbols) {
      card.symbols.split("|").forEach(s => symbols.add(s.trim()));
    }
  }

  return {
    types: Array.from(types).sort(),
    rarities: Array.from(rarities).sort(),
    setCodes: Array.from(setCodes).sort(),
    setNames: Array.from(setNames).sort(),
    keywords: Array.from(keywords).sort(),
    symbols: Array.from(symbols).sort(),
  };
}
