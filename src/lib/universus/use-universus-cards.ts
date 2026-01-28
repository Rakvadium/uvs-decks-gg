"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { useQuery, useConvex } from "convex/react";
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
} from "./card-store";
import type { CachedCard } from "./card-store";
import type { CardFilters } from "@/providers/UIStateProvider";

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

  const releasedCards = useQuery(api.cards.listReleased);

  const loadFromCache = useCallback(async (): Promise<boolean> => {
    try {
      const [cachedCards, metadata] = await Promise.all([
        getCachedCards(),
        getCacheMetadata(),
      ]);
      
      if (cachedCards.length > 0) {
        setCards(cachedCards);
        setCachedVersion(metadata?.version ?? null);
        const cardIndex = buildCardIndex(cachedCards);
        setIndex(cardIndex);
        setUniqueValues(getUniqueValues(cachedCards));
        setLoadProgress(100);
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to load from cache:", err);
      return false;
    }
  }, []);

  const syncFromConvex = useCallback(async (serverCards: CachedCard[]) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setIsSyncing(true);
    
    try {
      const newVersion = Date.now();
      
      await setCachedCards(serverCards);
      await setCacheMetadata({
        version: newVersion,
        updatedAt: newVersion,
        cardCount: serverCards.length,
        lastSyncAt: newVersion,
      });
      
      setCards(serverCards);
      setCachedVersion(newVersion);
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
    await clearCardCache();
    setCachedVersion(null);
    setCards([]);
    setIndex(null);
    setUniqueValues(null);
    setLoadProgress(0);
    setIsLoading(true);
    syncInProgress.current = false;
    
    if (releasedCards) {
      await syncFromConvex(releasedCards);
    }
  }, [releasedCards, syncFromConvex]);

  useEffect(() => {
    if (!isHydrated) return;
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    const initializeCards = async () => {
      const hasCache = await loadFromCache();
      if (!hasCache) {
        setIsLoading(true);
      }
    };
    
    initializeCards();
  }, [isHydrated, loadFromCache]);

  useEffect(() => {
    if (!isHydrated) return;
    if (releasedCards === undefined) return;
    
    const updateFromServer = async () => {
      const metadata = await getCacheMetadata();
      
      if (!metadata || releasedCards.length !== metadata.cardCount) {
        await syncFromConvex(releasedCards);
      } else if (cards.length === 0 && releasedCards.length > 0) {
        setCards(releasedCards);
        setIsLoading(false);
      }
    };
    
    updateFromServer();
  }, [isHydrated, releasedCards, syncFromConvex, cards.length]);

  return {
    cards,
    isLoading: isLoading && cards.length === 0,
    isLoadingMore,
    loadProgress,
    totalCards: releasedCards?.length ?? cards.length,
    cachedVersion,
    serverVersion: null,
    isSyncing,
    error,
    index,
    uniqueValues,
    refreshCache,
    isHydrated,
  };
}

export function filterCards(
  cards: CachedCard[],
  filters: CardFilters
): CachedCard[] {
  let result = cards;

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
      const cardSymbols = card.symbols.split("|").map(s => s.trim().toLowerCase());
      if (filters.symbolMatchAll) {
        return filters.symbols!.every(s => cardSymbols.includes(s.toLowerCase()));
      }
      return filters.symbols!.some(s => cardSymbols.includes(s.toLowerCase()));
    });
  }

  if (filters.keywords && filters.keywords.length > 0) {
    result = result.filter((card) => {
      if (!card.keywords) return false;
      const cardKeywords = card.keywords.split("|").map(k => k.trim().toLowerCase());
      if (filters.keywordMatchAll) {
        return filters.keywords!.every(k => cardKeywords.includes(k.toLowerCase()));
      }
      return filters.keywords!.some(k => cardKeywords.includes(k.toLowerCase()));
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
    result = result.filter((card) => card.attackZone && filters.attackZone!.includes(card.attackZone));
  }

  if (filters.blockZone && filters.blockZone.length > 0) {
    result = result.filter((card) => card.blockZone && filters.blockZone!.includes(card.blockZone));
  }

  return result;
}

export function sortCards(
  cards: CachedCard[],
  options: CardSortOptions
): CachedCard[] {
  const { field, direction } = options;
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
        comparison = a.name.localeCompare(b.name);
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
