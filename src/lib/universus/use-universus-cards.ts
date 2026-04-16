"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore, useMemo } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  getCachedCards,
  setCachedCards,
  getCacheMetadata,
  setCacheMetadata,
  clearCardCache,
  buildCardIndex,
  CardIndex,
  getUniqueValues,
  cardHasKeyword,
} from "./card-store";
import type { CachedCard } from "./card-store";
import type { CardFilters, StatFilterValue, StatOperator } from "@/providers/UIStateProvider";

export type { CachedCard } from "./card-store";

export type SortDirection = "asc" | "desc";

export interface CardSortOptions {
  field: string;
  direction: SortDirection;
}

export interface UseUniversusCardsResult {
  cards: CachedCard[];
  isLoading: boolean;
  isLoadingMore: boolean;
  loadProgress: number;
  totalCards: number;
  cachedVersion: number | null;
  serverVersion: number | null;
  isCheckingVersion: boolean;
  isSyncing: boolean;
  error: Error | null;
  index: CardIndex | null;
  uniqueValues: ReturnType<typeof getUniqueValues> | null;
  refreshCache: () => Promise<void>;
  isHydrated: boolean;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

export function useUniversusCards(): UseUniversusCardsResult {
  const [cards, setCards] = useState<CachedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [cachedVersion, setCachedVersion] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [index, setIndex] = useState<CardIndex | null>(null);
  const [uniqueValues, setUniqueValues] = useState<ReturnType<typeof getUniqueValues> | null>(null);
  
  const syncInProgress = useRef(false);
  const initialLoadDone = useRef(false);
  const convex = useConvex();
  const isHydrated = useIsClient();
  
  const serverVersionData = useQuery(api.cards.getCardDataVersion, {});
  const serverVersion = serverVersionData?.version ?? null;
  const isCheckingVersion = serverVersionData === undefined;

  const loadFromCache = useCallback(async (): Promise<{ hasCache: boolean; version: number | null }> => {
    try {
      const [cachedCards, metadata] = await Promise.all([
        getCachedCards(),
        getCacheMetadata(),
      ]);
      
      if (cachedCards.length > 0 && metadata) {
        setCards(cachedCards);
        setCachedVersion(metadata.version);
        const cardIndex = buildCardIndex(cachedCards);
        setIndex(cardIndex);
        setUniqueValues(getUniqueValues(cachedCards));
        setLoadProgress(100);
        setIsLoading(false);
        return { hasCache: true, version: metadata.version };
      }
      return { hasCache: false, version: null };
    } catch (err) {
      console.error("Failed to load from cache:", err);
      return { hasCache: false, version: null };
    }
  }, []);

  const fetchFromConvex = useCallback(async (): Promise<CachedCard[]> => {
    const allCards: CachedCard[] = [];
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: { cards: Array<any>; cursor: string | null; isDone: boolean } = await convex.query(api.cards.listReleasedPaginated, {
        cursor,
        limit: 1000,
      });

      allCards.push(...result.cards);
      cursor = result.cursor;
      isDone = result.isDone;
      
      const progress = Math.min(95, Math.round((allCards.length / 3000) * 100));
      setLoadProgress(progress);
    }

    return allCards;
  }, [convex]);

  const syncFromConvex = useCallback(async (serverCards: CachedCard[], version: number) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setIsSyncing(true);
    
    try {
      const now = Date.now();
      
      await setCachedCards(serverCards);
      await setCacheMetadata({
        version,
        updatedAt: now,
        cardCount: serverCards.length,
        lastSyncAt: now,
      });
      
      setCards(serverCards);
      setCachedVersion(version);
      const cardIndex = buildCardIndex(serverCards);
      setIndex(cardIndex);
      setUniqueValues(getUniqueValues(serverCards));
      setLoadProgress(100);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        console.error("Failed to sync cards:", err);
      }
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, []);

  const refreshCache = useCallback(async () => {
    if (serverVersion === null) return;
    
    await clearCardCache();
    setCachedVersion(null);
    setCards([]);
    setIndex(null);
    setUniqueValues(null);
    setLoadProgress(0);
    setIsLoading(true);
    syncInProgress.current = false;
    
    const freshCards = await fetchFromConvex();
    await syncFromConvex(freshCards, serverVersion);
  }, [fetchFromConvex, syncFromConvex, serverVersion]);

  useEffect(() => {
    if (!isHydrated) return;
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    const initializeCards = async () => {
      const { hasCache, version: localVersion } = await loadFromCache();
      
      if (!hasCache) {
        setIsLoading(true);
      }
    };
    
    initializeCards();
  }, [isHydrated, loadFromCache]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isCheckingVersion) return;
    if (syncInProgress.current) return;
    
    const checkAndSync = async () => {
      if (serverVersion === null) {
        if (cards.length === 0) {
          setIsLoading(true);
          setIsLoadingMore(true);
          const freshCards = await fetchFromConvex();
          await syncFromConvex(freshCards, 1);
          setIsLoadingMore(false);
        }
        return;
      }
      
      if (cachedVersion === null) {
        setIsLoading(true);
        setIsLoadingMore(true);
        const freshCards = await fetchFromConvex();
        await syncFromConvex(freshCards, serverVersion);
        setIsLoadingMore(false);
        return;
      }
      
      if (cachedVersion !== serverVersion) {
        console.log(`Cache outdated: local v${cachedVersion} vs server v${serverVersion}`);
        setIsSyncing(true);
        const freshCards = await fetchFromConvex();
        await syncFromConvex(freshCards, serverVersion);
      }
    };
    
    checkAndSync();
  }, [isHydrated, isCheckingVersion, serverVersion, cachedVersion, cards.length, fetchFromConvex, syncFromConvex]);

  return useMemo(
    () => ({
      cards,
      isLoading: isLoading && cards.length === 0,
      isLoadingMore,
      loadProgress,
      totalCards: cards.length,
      cachedVersion,
      serverVersion,
      isCheckingVersion,
      isSyncing,
      error,
      index,
      uniqueValues,
      refreshCache,
      isHydrated,
    }),
    [
      cards,
      isLoading,
      isLoadingMore,
      loadProgress,
      cachedVersion,
      serverVersion,
      isCheckingVersion,
      isSyncing,
      error,
      index,
      uniqueValues,
      refreshCache,
      isHydrated,
    ]
  );
}

function matchesStatFilter(cardValue: number | undefined, filter: StatFilterValue | undefined): boolean {
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

export function filterCards(
  cards: CachedCard[],
  filters: CardFilters
): CachedCard[] {
  let result = cards.filter((card) => card.isFrontFace !== false && card.isVariant !== true);

  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    const searchMode = filters.searchMode ?? "name";
    
    result = result.filter((card) => {
      if (searchMode === "name" || searchMode === "all") {
        if (card.name.toLowerCase().includes(searchLower)) return true;
        if (card.searchName?.toLowerCase().includes(searchLower)) return true;
      }
      if (searchMode === "text" || searchMode === "all") {
        if (card.text?.toLowerCase().includes(searchLower)) return true;
        if (card.searchText?.toLowerCase().includes(searchLower)) return true;
      }
      if (searchMode === "all") {
        if (card.searchAll?.toLowerCase().includes(searchLower)) return true;
      }
      return false;
    });
  }

  if (filters.type && filters.type.length > 0) {
    result = result.filter((card) => card.type && filters.type!.includes(card.type));
  }

  if (filters.rarity && filters.rarity.length > 0) {
    result = result.filter((card) => card.rarity && filters.rarity!.includes(card.rarity));
  }

  if (filters.set && filters.set.length > 0) {
    result = result.filter((card) => card.setCode && filters.set!.includes(card.setCode));
  }

  if (filters.symbols && filters.symbols.length > 0) {
    result = result.filter((card) => {
      if (!card.symbols) return false;
      let cardSymbols = card.symbols.split("|").map(s => s.trim().toLowerCase());
      if (filters.symbolMatchAll) {
        return filters.symbols!.every(s => cardSymbols.includes(s.toLowerCase()));  
      }
      const isAttuned = cardSymbols.some(s => s.toLowerCase().startsWith("attuned"));
      const isAttunedFilter = filters.symbols?.some(s => s.toLowerCase().startsWith("attuned"));
      if (isAttuned && !isAttunedFilter) {
        cardSymbols = cardSymbols.map(s => s.replace("attuned:", "").toLowerCase());
      }
      return filters.symbols!.some(s => cardSymbols.includes(s.toLowerCase()));
    });
  }

  if (filters.keywords && filters.keywords.length > 0) {
    result = result.filter((card) => {
      if (!card.keywords) return false;
      if (filters.keywordMatchAll) {
        return filters.keywords!.every(k => cardHasKeyword(card, k));
      }
      return filters.keywords!.some(k => cardHasKeyword(card, k));
    });
  }

  if (filters.difficultyMin !== undefined || filters.difficultyMax !== undefined) {
    result = result.filter((card) => {
      if (card.difficulty === undefined) return false;
      if (filters.difficultyMin !== undefined && card.difficulty < filters.difficultyMin) return false;
      if (filters.difficultyMax !== undefined && card.difficulty > filters.difficultyMax) return false;
      return true;
    });
  }

  if (filters.controlMin !== undefined || filters.controlMax !== undefined) {
    result = result.filter((card) => {
      if (card.control === undefined) return false;
      if (filters.controlMin !== undefined && card.control < filters.controlMin) return false;
      if (filters.controlMax !== undefined && card.control > filters.controlMax) return false;
      return true;
    });
  }

  if (filters.speedMin !== undefined || filters.speedMax !== undefined) {
    result = result.filter((card) => {
      if (card.speed === undefined) return false;
      if (filters.speedMin !== undefined && card.speed < filters.speedMin) return false;
      if (filters.speedMax !== undefined && card.speed > filters.speedMax) return false;
      return true;
    });
  }

  if (filters.damageMin !== undefined || filters.damageMax !== undefined) {
    result = result.filter((card) => {
      if (card.damage === undefined) return false;
      if (filters.damageMin !== undefined && card.damage < filters.damageMin) return false;
      if (filters.damageMax !== undefined && card.damage > filters.damageMax) return false;
      return true;
    });
  }

  if (filters.attackZone && filters.attackZone.length > 0) {
    result = result.filter((card) => card.attackZone && filters.attackZone?.map(z => z.toLowerCase())!.includes(card.attackZone!.toLowerCase()));
  }

  if (filters.blockZone && filters.blockZone.length > 0) {
    result = result.filter((card) => card.blockZone && filters.blockZone?.map(z => z.toLowerCase())!.includes(card.blockZone!.toLowerCase()));
  }

  if (filters.difficulty) {
    result = result.filter((card) => matchesStatFilter(card.difficulty, filters.difficulty));
  }

  if (filters.control) {
    result = result.filter((card) => matchesStatFilter(card.control, filters.control));
  }

  if (filters.speed) {
    result = result.filter((card) => matchesStatFilter(card.speed, filters.speed));
  }

  if (filters.damage) {
    result = result.filter((card) => matchesStatFilter(card.damage, filters.damage));
  }

  if (filters.blockModifier) {
    result = result.filter((card) => matchesStatFilter(card.blockModifier, filters.blockModifier));
  }

  if (filters.health) {
    result = result.filter((card) => matchesStatFilter(card.health, filters.health));
  }

  if (filters.handSize) {
    result = result.filter((card) => matchesStatFilter(card.handSize, filters.handSize));
  }

  if (filters.stamina) {
    result = result.filter((card) => matchesStatFilter(card.stamina, filters.stamina));
  }

  return result;
}

function defaultCardSort(a: CachedCard, b: CachedCard): number {
  const setNumA = a.setNumber ?? 0;
  const setNumB = b.setNumber ?? 0;
  if (setNumA !== setNumB) {
    return setNumB - setNumA;
  }
  
  const collectorA = parseInt(a.collectorNumber ?? "0", 10);
  const collectorB = parseInt(b.collectorNumber ?? "0", 10);
  return collectorA - collectorB;
}

export function sortCards(
  cards: CachedCard[],
  options: CardSortOptions
): CachedCard[] {
  const { field, direction } = options;
  
  if (field === "default") {
    return [...cards].sort(defaultCardSort);
  }
  
  const multiplier = direction === "desc" ? -1 : 1;

  return [...cards].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "type":
        comparison = (a.type ?? "").localeCompare(b.type ?? "");
        break;
      case "rarity":
        comparison = (a.rarity ?? "").localeCompare(b.rarity ?? "");
        break;
      case "setCode":
      case "set":
        comparison = (a.setCode ?? "").localeCompare(b.setCode ?? "");
        break;
      case "setNumber":
        comparison = (a.setNumber ?? 0) - (b.setNumber ?? 0);
        break;
      case "collectorNumber":
        comparison = parseInt(a.collectorNumber ?? "0", 10) - parseInt(b.collectorNumber ?? "0", 10);
        break;
      case "difficulty":
        comparison = (a.difficulty ?? 0) - (b.difficulty ?? 0);
        break;
      case "control":
        comparison = (a.control ?? 0) - (b.control ?? 0);
        break;
      case "speed":
        comparison = (a.speed ?? 0) - (b.speed ?? 0);
        break;
      case "damage":
        comparison = (a.damage ?? 0) - (b.damage ?? 0);
        break;
      default:
        return defaultCardSort(a, b);
    }

    return comparison * multiplier;
  });
}

export function paginateCards(
  cards: CachedCard[],
  page: number,
  pageSize: number
): {
  cards: CachedCard[];
  totalPages: number;
  hasMore: boolean;
} {
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCards = cards.slice(startIndex, endIndex);
  const totalPages = Math.ceil(cards.length / pageSize);

  return {
    cards: paginatedCards,
    totalPages,
    hasMore: endIndex < cards.length,
  };
}
