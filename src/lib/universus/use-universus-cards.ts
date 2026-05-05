"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore, useMemo } from "react";
import { useConvex, useQuery, type ConvexReactClient } from "convex/react";
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
  CARD_CACHE_SCHEMA_VERSION,
  isGalleryCatalogCard,
} from "./card-store";
import type { CachedCard } from "./card-store";
import type { CardFilters, StatFilterValue } from "@/providers/UIStateProvider";

export type { CachedCard } from "./card-store";

export type SortDirection = "asc" | "desc";

export interface CardSortOptions {
  field: string;
  direction: SortDirection;
}

export type FilterCardsFormatOptions = {
  passesFormatLegality?: (setCode: string | undefined) => boolean;
};

export interface UseUniversusCardsResult {
  cards: CachedCard[];
  isLoading: boolean;
  isCatalogDataLoading: boolean;
  isCatalogIndexReady: boolean;
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

const GALLERY_CATALOG_SYNC_PAGE_SIZE = 1000;
const COMPANION_ID_CHUNK = 200;

async function fetchCompanionCardsForGallery(
  gallery: CachedCard[],
  convex: ConvexReactClient
): Promise<CachedCard[]> {
  const ids = [
    ...new Set(
      gallery
        .map((c) => c.backCardId)
        .filter((id): id is NonNullable<typeof id> => Boolean(id))
    ),
  ];
  if (ids.length === 0) return [];
  const out: CachedCard[] = [];
  for (let i = 0; i < ids.length; i += COMPANION_ID_CHUNK) {
    const chunk = ids.slice(i, i + COMPANION_ID_CHUNK);
    const batch = await convex.query(api.cards.batchGetCardsByIds, { ids: chunk });
    out.push(...batch);
  }
  return out;
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
  const dataEpochRef = useRef(0);
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
        if (metadata.schemaVersion !== CARD_CACHE_SCHEMA_VERSION) {
          await clearCardCache();
          return { hasCache: false, version: null };
        }
        let companions: CachedCard[] = [];
        try {
          companions = await fetchCompanionCardsForGallery(cachedCards, convex);
        } catch (e) {
          console.error("Failed to load companion card faces:", e);
        }
        const merged = [...cachedCards, ...companions];
        setCards(merged);
        setCachedVersion(metadata.version);
        const cardIndex = buildCardIndex(cachedCards, companions);
        setIndex(cardIndex);
        setUniqueValues(getUniqueValues(cachedCards));
        setLoadProgress(100);
        setIsLoading(false);
        dataEpochRef.current += 1;
        return { hasCache: true, version: metadata.version };
      }
      return { hasCache: false, version: null };
    } catch (err) {
      console.error("Failed to load from cache:", err);
      return { hasCache: false, version: null };
    }
  }, [convex]);

  const galleryTotalEstimate = serverVersionData?.cardCount ?? 0;

  const fetchFromConvex = useCallback(async (): Promise<{
    gallery: CachedCard[];
    companions: CachedCard[];
  }> => {
    const gallery: CachedCard[] = [];
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: { cards: CachedCard[]; cursor: string | null; isDone: boolean } =
        await convex.query(api.cards.listReleasedPaginated, {
          cursor,
          limit: GALLERY_CATALOG_SYNC_PAGE_SIZE,
        });

      gallery.push(...result.cards);
      cursor = result.cursor;
      isDone = result.isDone;

      const fetched = gallery.length;
      let progress: number;
      if (isDone) {
        progress = 100;
      } else if (galleryTotalEstimate > 0) {
        progress = Math.min(
          99,
          Math.round((fetched / galleryTotalEstimate) * 100)
        );
      } else {
        const denom = Math.max(fetched + GALLERY_CATALOG_SYNC_PAGE_SIZE, 1);
        progress = Math.min(99, Math.round((fetched / denom) * 100));
      }
      setLoadProgress(progress);
    }

    const companions = await fetchCompanionCardsForGallery(gallery, convex);
    return { gallery, companions };
  }, [convex, galleryTotalEstimate]);

  const syncFromConvex = useCallback(
    async (gallery: CachedCard[], companions: CachedCard[], version: number) => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      setIsSyncing(true);

      try {
        const now = Date.now();
        const merged = [...gallery, ...companions];

        await setCachedCards(gallery);
        await setCacheMetadata({
          version,
          updatedAt: now,
          cardCount: gallery.length,
          lastSyncAt: now,
          schemaVersion: CARD_CACHE_SCHEMA_VERSION,
        });

        setCards(merged);
        setCachedVersion(version);
        const cardIndex = buildCardIndex(gallery, companions);
        setIndex(cardIndex);
        setUniqueValues(getUniqueValues(gallery));
        setLoadProgress(100);
        setIsLoading(false);
        dataEpochRef.current += 1;
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
          console.error("Failed to sync cards:", err);
        }
      } finally {
        setIsSyncing(false);
        syncInProgress.current = false;
      }
    },
    []
  );

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

    const { gallery, companions } = await fetchFromConvex();
    await syncFromConvex(gallery, companions, serverVersion);
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
          const epochBefore = dataEpochRef.current;
          const { gallery, companions } = await fetchFromConvex();
          if (epochBefore !== dataEpochRef.current) {
            setIsLoadingMore(false);
            return;
          }
          await syncFromConvex(gallery, companions, 1);
          setIsLoadingMore(false);
        }
        return;
      }

      if (cachedVersion === null) {
        setIsLoading(true);
        setIsLoadingMore(true);
        const epochBefore = dataEpochRef.current;
        const { gallery, companions } = await fetchFromConvex();
        if (epochBefore !== dataEpochRef.current) {
          setIsLoadingMore(false);
          return;
        }
        await syncFromConvex(gallery, companions, serverVersion);
        setIsLoadingMore(false);
        return;
      }

      if (cachedVersion !== serverVersion) {
        console.log(`Cache outdated: local v${cachedVersion} vs server v${serverVersion}`);
        setIsSyncing(true);
        const epochBefore = dataEpochRef.current;
        const { gallery, companions } = await fetchFromConvex();
        if (epochBefore !== dataEpochRef.current) {
          setIsSyncing(false);
          return;
        }
        await syncFromConvex(gallery, companions, serverVersion);
      }
    };
    
    checkAndSync();
  }, [isHydrated, isCheckingVersion, serverVersion, cachedVersion, cards.length, fetchFromConvex, syncFromConvex]);

  return useMemo(
    () => ({
      cards,
      isLoading: isLoading && cards.length === 0,
      isCatalogDataLoading: isLoading,
      isCatalogIndexReady: index !== null,
      isLoadingMore,
      loadProgress,
      totalCards: cards.reduce(
        (n, c) => n + (isGalleryCatalogCard(c) ? 1 : 0),
        0
      ),
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
  filters: CardFilters,
  formatOpts?: FilterCardsFormatOptions
): CachedCard[] {
  const passesFormatLegality = formatOpts?.passesFormatLegality;

  const searchTrimmed = filters.search?.trim();
  const hasSearch = Boolean(searchTrimmed);
  const searchLower = hasSearch && filters.search ? filters.search.toLowerCase() : "";
  const searchMode = filters.searchMode ?? "name";

  const types = filters.type;
  const hasTypeFilter = Boolean(types?.length);

  const rarities = filters.rarity;
  const hasRarityFilter = Boolean(rarities?.length);

  const sets = filters.set;
  const hasSetFilter = Boolean(sets?.length);

  const symbolFilters = filters.symbols;
  const hasSymbolFilter = Boolean(symbolFilters?.length);
  const symbolMatchAll = filters.symbolMatchAll === true;
  const isAttunedFilter = hasSymbolFilter && symbolFilters!.some((s) => s.toLowerCase().startsWith("attuned"));

  const keywordFilters = filters.keywords;
  const hasKeywordFilter = Boolean(keywordFilters?.length);
  const keywordMatchAll = filters.keywordMatchAll === true;

  const hasDifficultyRange =
    filters.difficultyMin !== undefined || filters.difficultyMax !== undefined;
  const hasControlRange = filters.controlMin !== undefined || filters.controlMax !== undefined;
  const hasSpeedRange = filters.speedMin !== undefined || filters.speedMax !== undefined;
  const hasDamageRange = filters.damageMin !== undefined || filters.damageMax !== undefined;

  const attackZonesLower =
    filters.attackZone && filters.attackZone.length > 0
      ? filters.attackZone.map((z) => z.toLowerCase())
      : null;
  const blockZonesLower =
    filters.blockZone && filters.blockZone.length > 0
      ? filters.blockZone.map((z) => z.toLowerCase())
      : null;

  const statDifficulty = filters.difficulty;
  const statControl = filters.control;
  const statSpeed = filters.speed;
  const statDamage = filters.damage;
  const statBlockModifier = filters.blockModifier;
  const statHealth = filters.health;
  const statHandSize = filters.handSize;
  const statStamina = filters.stamina;

  const out: CachedCard[] = [];
  for (const card of cards) {
    if (!isGalleryCatalogCard(card)) continue;

    if (hasSearch) {
      let ok = false;
      if (searchMode === "name" || searchMode === "all") {
        if (card.name.toLowerCase().includes(searchLower)) ok = true;
        else if (card.searchName?.toLowerCase().includes(searchLower)) ok = true;
      }
      if (!ok && (searchMode === "text" || searchMode === "all")) {
        if (card.text?.toLowerCase().includes(searchLower)) ok = true;
        else if (card.searchText?.toLowerCase().includes(searchLower)) ok = true;
      }
      if (!ok && searchMode === "all") {
        if (card.searchAll?.toLowerCase().includes(searchLower)) ok = true;
      }
      if (!ok) continue;
    }

    if (passesFormatLegality && !passesFormatLegality(card.setCode)) continue;

    if (hasTypeFilter) {
      if (!card.type || !types!.includes(card.type)) continue;
    }

    if (hasRarityFilter) {
      if (!card.rarity || !rarities!.includes(card.rarity)) continue;
    }

    if (hasSetFilter) {
      if (!card.setCode || !sets!.includes(card.setCode)) continue;
    }

    if (hasSymbolFilter) {
      if (!card.symbols) continue;
      let cardSymbols = card.symbols.split("|").map((s) => s.trim().toLowerCase());
      if (symbolMatchAll) {
        if (!symbolFilters!.every((s) => cardSymbols.includes(s.toLowerCase()))) continue;
      } else {
        const isAttuned = cardSymbols.some((s) => s.toLowerCase().startsWith("attuned"));
        if (isAttuned && !isAttunedFilter) {
          cardSymbols = cardSymbols.map((s) => s.replace("attuned:", "").toLowerCase());
        }
        if (!symbolFilters!.some((s) => cardSymbols.includes(s.toLowerCase()))) continue;
      }
    }

    if (hasKeywordFilter) {
      if (!card.keywords) continue;
      if (keywordMatchAll) {
        if (!keywordFilters!.every((k) => cardHasKeyword(card, k))) continue;
      } else {
        if (!keywordFilters!.some((k) => cardHasKeyword(card, k))) continue;
      }
    }

    if (hasDifficultyRange) {
      if (card.difficulty === undefined) continue;
      if (filters.difficultyMin !== undefined && card.difficulty < filters.difficultyMin) continue;
      if (filters.difficultyMax !== undefined && card.difficulty > filters.difficultyMax) continue;
    }

    if (hasControlRange) {
      if (card.control === undefined) continue;
      if (filters.controlMin !== undefined && card.control < filters.controlMin) continue;
      if (filters.controlMax !== undefined && card.control > filters.controlMax) continue;
    }

    if (hasSpeedRange) {
      if (card.speed === undefined) continue;
      if (filters.speedMin !== undefined && card.speed < filters.speedMin) continue;
      if (filters.speedMax !== undefined && card.speed > filters.speedMax) continue;
    }

    if (hasDamageRange) {
      if (card.damage === undefined) continue;
      if (filters.damageMin !== undefined && card.damage < filters.damageMin) continue;
      if (filters.damageMax !== undefined && card.damage > filters.damageMax) continue;
    }

    if (attackZonesLower) {
      if (!card.attackZone || !attackZonesLower.includes(card.attackZone.toLowerCase())) continue;
    }

    if (blockZonesLower) {
      if (!card.blockZone || !blockZonesLower.includes(card.blockZone.toLowerCase())) continue;
    }

    if (statDifficulty && !matchesStatFilter(card.difficulty, statDifficulty)) continue;
    if (statControl && !matchesStatFilter(card.control, statControl)) continue;
    if (statSpeed && !matchesStatFilter(card.speed, statSpeed)) continue;
    if (statDamage && !matchesStatFilter(card.damage, statDamage)) continue;
    if (statBlockModifier && !matchesStatFilter(card.blockModifier, statBlockModifier)) continue;
    if (statHealth && !matchesStatFilter(card.health, statHealth)) continue;
    if (statHandSize && !matchesStatFilter(card.handSize, statHandSize)) continue;
    if (statStamina && !matchesStatFilter(card.stamina, statStamina)) continue;

    out.push(card);
  }

  return out;
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

type SortPairComparator = (a: CachedCard, b: CachedCard) => number;

function getSortPairComparator(field: string, multiplier: number): SortPairComparator {
  switch (field) {
    case "name":
      return (a, b) => a.name.localeCompare(b.name) * multiplier;
    case "type":
      return (a, b) => (a.type ?? "").localeCompare(b.type ?? "") * multiplier;
    case "rarity":
      return (a, b) => (a.rarity ?? "").localeCompare(b.rarity ?? "") * multiplier;
    case "setCode":
    case "set":
      return (a, b) => (a.setCode ?? "").localeCompare(b.setCode ?? "") * multiplier;
    case "setNumber":
      return (a, b) => ((a.setNumber ?? 0) - (b.setNumber ?? 0)) * multiplier;
    case "collectorNumber":
      return (a, b) =>
        (parseInt(a.collectorNumber ?? "0", 10) - parseInt(b.collectorNumber ?? "0", 10)) * multiplier;
    case "difficulty":
      return (a, b) => ((a.difficulty ?? 0) - (b.difficulty ?? 0)) * multiplier;
    case "control":
      return (a, b) => ((a.control ?? 0) - (b.control ?? 0)) * multiplier;
    case "speed":
      return (a, b) => ((a.speed ?? 0) - (b.speed ?? 0)) * multiplier;
    case "damage":
      return (a, b) => ((a.damage ?? 0) - (b.damage ?? 0)) * multiplier;
    default:
      return defaultCardSort;
  }
}

export function sortCards(
  cards: CachedCard[],
  options: CardSortOptions
): CachedCard[] {
  const { field, direction } = options;

  if (cards.length === 0) {
    return [];
  }

  if (cards.length === 1) {
    return [cards[0]];
  }

  if (field === "default") {
    return [...cards].sort(defaultCardSort);
  }
  const multiplier = direction === "desc" ? -1 : 1;
  const compare = getSortPairComparator(field, multiplier);
  return [...cards].sort(compare);
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
