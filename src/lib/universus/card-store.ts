import type { Doc } from "../../../convex/_generated/dataModel";

export type CachedCard = Doc<"cards">;

export const KEYWORD_LIST = [
  "Ally",
  "Breaker",
  "Charge",
  "Combo",
  "Deflect",
  "Desperation",
  "Diplomacy",
  "EX",
  "Echo",
  "Elusive",
  "Flash",
  "Frenzy",
  "Fury",
  "Gauge",
  "Item",
  "Kick",
  "Multiple",
  "Only",
  "Pizza",
  "Powerful",
  "Punch",
  "Ranged",
  "Reversal",
  "Safe",
  "Scheme",
  "Shift",
  "Slam",
  "Spell",
  "Stance",
  "Stun",
  "Taunt",
  "Tech",
  "Tension",
  "Terrain",
  "Throw",
  "Titan",
  "Unique",
  "Vestige",
  "Weapon",
  "XP",
] as const;

export type Keyword = (typeof KEYWORD_LIST)[number];

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

let cardStorePromise: Promise<ReturnType<typeof import("idb-keyval").createStore>> | null = null;

async function getCardStore() {
  if (typeof window === "undefined") return null;
  
  if (!cardStorePromise) {
    cardStorePromise = import("idb-keyval").then(({ createStore }) => {
      return createStore(DB_NAME, STORE_NAME);
    });
  }
  
  return cardStorePromise;
}

export async function getCacheMetadata(): Promise<CardCacheMetadata | null> {
  const store = await getCardStore();
  if (!store) return null;
  
  try {
    const { get } = await import("idb-keyval");
    const metadata = await get<CardCacheMetadata>(METADATA_KEY, store);
    return metadata ?? null;
  } catch {
    return null;
  }
}

export async function setCacheMetadata(metadata: CardCacheMetadata): Promise<void> {
  const store = await getCardStore();
  if (!store) return;
  
  try {
    const { set } = await import("idb-keyval");
    await set(METADATA_KEY, metadata, store);
  } catch (error) {
    console.error("Failed to save cache metadata:", error);
  }
}

export async function getCachedCards(): Promise<CachedCard[]> {
  const store = await getCardStore();
  if (!store) return [];
  
  try {
    const { get } = await import("idb-keyval");
    const cards = await get<CachedCard[]>(CARDS_KEY, store);
    return cards ?? [];
  } catch {
    return [];
  }
}

export async function setCachedCards(cards: CachedCard[]): Promise<void> {
  const store = await getCardStore();
  if (!store) return;
  
  try {
    const { set } = await import("idb-keyval");
    await set(CARDS_KEY, cards, store);
  } catch (error) {
    console.error("Failed to save cards to cache:", error);
  }
}

export async function appendCachedCards(newCards: CachedCard[]): Promise<CachedCard[]> {
  const store = await getCardStore();
  if (!store) return newCards;
  
  try {
    const { set } = await import("idb-keyval");
    const existingCards = await getCachedCards();
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

export async function clearCardCache(): Promise<void> {
  const store = await getCardStore();
  if (!store) return;
  
  try {
    const { del } = await import("idb-keyval");
    await del(METADATA_KEY, store);
    await del(CARDS_KEY, store);
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
  setNumbers: number[];
  keywords: string[];
  symbols: string[];
} {
  const types = new Set<string>();
  const rarities = new Set<string>();
  const setData = new Map<string, { name: string; number: number }>();
  const symbols = new Set<string>();

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
  }

  const sortedSets = Array.from(setData.entries())
    .sort((a, b) => (b[1].number ?? 0) - (a[1].number ?? 0));

  return {
    types: Array.from(types).filter(t => t !== "Special").sort(),
    rarities: Array.from(rarities).sort(),
    setCodes: sortedSets.map(([code]) => code),
    setNames: sortedSets.map(([, data]) => data.name),
    setNumbers: sortedSets.map(([, data]) => data.number),
    keywords: [...KEYWORD_LIST],
    symbols: Array.from(symbols).sort(),
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