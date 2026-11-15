"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore, useMemo } from "react";
import { useConvex, useQuery, type ConvexReactClient } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  getCachedCatalog,
  setCachedCatalog,
  type CachedCatalog,
  setCachedCompanions,
  clearCardCache,
  buildCardIndex,
  CardIndex,
  getUniqueValues,
  cardHasKeyword,
  CARD_CACHE_SCHEMA_VERSION,
  isGalleryCatalogCard,
} from "./card-store";
import type { CachedCard } from "./card-store";
import type { CardFilters } from "@/providers/UIStateProvider";
import {
  compileFacetFilter,
  compileStatZoneFilter,
  getStatSortComparator,
  type GameFilterDefinition,
} from "@shared/games/filters";
import { fetchStaticCatalog } from "./static-catalog";
import { markCatalogCached } from "./catalog-prefetch";
import { useGameId, useGameModule } from "@/games/game-context";
import { cardMatchesRarityFilter } from "./rarity";
import type { GameId } from "@shared/games/types";

export type { CachedCard } from "./card-store";

export type SortDirection = "asc" | "desc";

export interface CardSortOptions {
  field: string;
  direction: SortDirection;
}

export type FilterCardsFormatOptions = {
  passesFormatLegality?: (setCode: string | undefined) => boolean;
  isCardBannedInFormat?: (cardId: string) => boolean;
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
  convex: ConvexReactClient,
  game: GameId
): Promise<CachedCard[]> {
  const ids = [
    ...new Set(
      gallery
        .map((c) => c.backCardId)
        .filter((id): id is NonNullable<typeof id> => Boolean(id))
    ),
  ];
  if (ids.length === 0) return [];
  const chunks: (typeof ids)[] = [];
  for (let i = 0; i < ids.length; i += COMPANION_ID_CHUNK) {
    chunks.push(ids.slice(i, i + COMPANION_ID_CHUNK));
  }
  const batches = await Promise.all(
    chunks.map((chunk) => convex.query(api.cards.batchGetCardsByIds, { game, ids: chunk }))
  );
  return batches.flat();
}

const cacheReads = new Map<GameId, Promise<CachedCatalog>>();
const prefetchedGames = new Set<GameId>();

/**
 * Starts reading the IndexedDB catalog cache for `game` (once per page load), so the read can
 * overlap hydration instead of waiting for the loader's effect. The loader takes the result.
 */
export function prefetchCardCache(game: GameId): void {
  if (typeof window === "undefined" || prefetchedGames.has(game)) return;
  prefetchedGames.add(game);
  cacheReads.set(game, getCachedCatalog(game));
}

function takeCardCacheRead(game: GameId): Promise<CachedCatalog> {
  const read = cacheReads.get(game) ?? getCachedCatalog(game);
  cacheReads.delete(game);
  return read;
}

/** `pending` until the IndexedDB read settles; syncing waits for it so a cache hit isn't re-downloaded. */
type CacheState = "pending" | "hit" | "miss";

export function useUniversusCards(): UseUniversusCardsResult {
  const [cards, setCards] = useState<CachedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [cachedVersion, setCachedVersion] = useState<number | null>(null);
  const [cacheState, setCacheState] = useState<CacheState>("pending");
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [index, setIndex] = useState<CardIndex | null>(null);
  const [uniqueValues, setUniqueValues] = useState<ReturnType<typeof getUniqueValues> | null>(null);

  const syncInProgress = useRef(false);
  const initialLoadDone = useRef(false);
  const convex = useConvex();
  const game = useGameId();
  const { filters: filterDefinition } = useGameModule();
  const isHydrated = useIsClient();

  const serverVersionData = useQuery(api.cards.getCardDataVersion, { game });
  const serverVersion = serverVersionData?.version ?? null;
  const isCheckingVersion = serverVersionData === undefined;

  /** Adds back faces once they load; the grid renders without them first. */
  const applyCompanions = useCallback((gallery: CachedCard[], companions: CachedCard[]) => {
    if (companions.length === 0) return;
    setCards([...gallery, ...companions]);
    setIndex((prev) => {
      if (!prev) return buildCardIndex(gallery, companions);
      const byId = new Map(prev.byId);
      for (const card of companions) byId.set(card._id, card);
      return { ...prev, byId };
    });
  }, []);

  const applyCatalog = useCallback(
    (gallery: CachedCard[], companions: CachedCard[], version: number) => {
      setCards(companions.length > 0 ? [...gallery, ...companions] : gallery);
      setCachedVersion(version);
      setIndex(buildCardIndex(gallery, companions));
      setUniqueValues(getUniqueValues(gallery, filterDefinition));
      setLoadProgress(100);
      setIsLoading(false);
      setError(null);
    },
    [filterDefinition]
  );

  const loadFromCache = useCallback(async () => {
    try {
      const { metadata, cards: cachedCards, companions: cachedCompanions } =
        await takeCardCacheRead(game);

      if (cachedCards.length === 0 || !metadata) {
        markCatalogCached(game, null);
        setCacheState("miss");
        return;
      }
      if (metadata.schemaVersion !== CARD_CACHE_SCHEMA_VERSION) {
        await clearCardCache(game);
        markCatalogCached(game, null);
        setCacheState("miss");
        return;
      }

      applyCatalog(cachedCards, cachedCompanions ?? [], metadata.version);
      markCatalogCached(game, metadata.version);
      setCacheState("hit");

      if (cachedCompanions === null) {
        // Cache written before back faces were stored: fetch them once and backfill.
        try {
          const companions = await fetchCompanionCardsForGallery(cachedCards, convex, game);
          applyCompanions(cachedCards, companions);
          void setCachedCompanions(game, companions);
        } catch (e) {
          console.error("Failed to load companion card faces:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load from cache:", err);
      setCacheState("miss");
    }
  }, [applyCatalog, applyCompanions, convex, game]);

  const galleryTotalEstimate = serverVersionData?.cardCount ?? 0;
  const forceConvexCatalogSync =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_FORCE_CONVEX_CATALOG_SYNC === "1";

  const fetchFromConvex = useCallback(async (): Promise<CachedCard[]> => {
    await convex.mutation(api.rateLimit.claimCatalogSyncBudget, {});

    const gallery: CachedCard[] = [];
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: { cards: CachedCard[]; cursor: string | null; isDone: boolean } =
        await convex.query(api.cards.listReleasedPaginated, {
          game,
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

    return gallery;
  }, [convex, game, galleryTotalEstimate]);

  /** Gallery cards of the current catalog: the static R2 file, else a paged Convex sync. */
  const fetchCatalog = useCallback(async (): Promise<CachedCard[]> => {
    const catalogUrl = serverVersionData?.catalogUrl;
    const catalogSha256 = serverVersionData?.catalogSha256;
    const canUseStatic =
      !forceConvexCatalogSync &&
      typeof catalogUrl === "string" &&
      catalogUrl.length > 0 &&
      typeof catalogSha256 === "string" &&
      catalogSha256.length > 0;

    if (canUseStatic) {
      try {
        setLoadProgress(5);
        const gallery = await fetchStaticCatalog({
          catalogUrl,
          catalogSha256,
        });
        setLoadProgress(90);
        return gallery;
      } catch (err) {
        console.warn("Static catalog fetch failed; falling back to Convex sync", err);
      }
    }

    return await fetchFromConvex();
  }, [
    fetchFromConvex,
    forceConvexCatalogSync,
    serverVersionData?.catalogSha256,
    serverVersionData?.catalogUrl,
  ]);

  /** Downloads the catalog, shows it, then caches it (the IndexedDB write doesn't block rendering). */
  const syncCatalog = useCallback(
    async (version: number, mode: "initial" | "background") => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      if (mode === "initial") {
        setIsLoading(true);
        setIsLoadingMore(true);
      } else {
        setIsSyncing(true);
      }

      try {
        const gallery = await fetchCatalog();
        // First load: show the grid now and add back faces when they arrive. A background update
        // waits for them so the cards already on screen keep theirs.
        if (mode === "initial") applyCatalog(gallery, [], version);
        let companions: CachedCard[] | null = null;
        try {
          companions = await fetchCompanionCardsForGallery(gallery, convex, game);
        } catch (e) {
          // Cached without back faces; the next cache load fetches them.
          console.error("Failed to load companion card faces:", e);
        }
        if (mode === "initial") applyCompanions(gallery, companions ?? []);
        else applyCatalog(gallery, companions ?? [], version);
        const now = Date.now();
        void setCachedCatalog(game, {
          cards: gallery,
          companions,
          metadata: {
            version,
            updatedAt: now,
            cardCount: gallery.length,
            lastSyncAt: now,
            schemaVersion: CARD_CACHE_SCHEMA_VERSION,
          },
        }).then((saved) => {
          if (saved) markCatalogCached(game, version);
        });
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
          console.error("Failed to sync cards:", err);
        }
        setIsLoading(false);
      } finally {
        setIsLoadingMore(false);
        setIsSyncing(false);
        syncInProgress.current = false;
      }
    },
    [applyCatalog, applyCompanions, convex, fetchCatalog, game]
  );

  const refreshCache = useCallback(async () => {
    if (serverVersion === null) return;

    await clearCardCache(game);
    markCatalogCached(game, null);
    setCachedVersion(null);
    setCards([]);
    setIndex(null);
    setUniqueValues(null);
    setLoadProgress(0);
    setIsLoading(true);
    syncInProgress.current = false;

    await syncCatalog(serverVersion, "initial");
  }, [syncCatalog, serverVersion, game]);

  useEffect(() => {
    if (!isHydrated) return;
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    void loadFromCache();
  }, [isHydrated, loadFromCache]);

  useEffect(() => {
    if (!isHydrated) return;
    if (cacheState === "pending") return;
    if (isCheckingVersion) return;
    if (syncInProgress.current) return;

    if (serverVersion === null) {
      if (cards.length === 0) void syncCatalog(1, "initial");
      return;
    }
    if (cachedVersion === null) {
      void syncCatalog(serverVersion, "initial");
      return;
    }
    if (cachedVersion !== serverVersion) {
      console.log(`Cache outdated: local v${cachedVersion} vs server v${serverVersion}`);
      void syncCatalog(serverVersion, "background");
    }
  }, [isHydrated, cacheState, isCheckingVersion, serverVersion, cachedVersion, cards.length, syncCatalog]);

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

export function filterCards(
  cards: CachedCard[],
  filters: CardFilters,
  formatOpts: FilterCardsFormatOptions | undefined,
  filterDefinition: GameFilterDefinition
): CachedCard[] {
  const passesFormatLegality = formatOpts?.passesFormatLegality;
  const isCardBannedInFormat = formatOpts?.isCardBannedInFormat;

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

  const symbolFiltersRaw = filters.symbols?.filter((s) => s.toLowerCase() !== "infinity");
  const symbolFilters =
    symbolFiltersRaw && symbolFiltersRaw.length > 0 ? symbolFiltersRaw : undefined;
  const hasSymbolFilter = Boolean(symbolFilters?.length);
  const includeInfinityResults = filters.includeInfinity !== false;
  const symbolMatchAll = filters.symbolMatchAll === true;
  const isAttunedFilter =
    hasSymbolFilter && symbolFilters!.some((s) => s.toLowerCase().startsWith("attuned"));

  const keywordFilters = filters.keywords;
  const hasKeywordFilter = Boolean(keywordFilters?.length);
  const keywordMatchAll = filters.keywordMatchAll === true;

  // Stat rules, legacy min/max ranges, and zones come from the game's filter definition.
  const matchesStatZoneFilters = compileStatZoneFilter(filterDefinition, filters);
  // Color / tag facets (games whose definition declares them).
  const matchesFacetFilters = compileFacetFilter(filterDefinition, filters);

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

    if (isCardBannedInFormat && filters.includeBanned !== true && isCardBannedInFormat(card._id)) continue;

    if (hasTypeFilter) {
      if (!card.type || !types!.includes(card.type)) continue;
    }

    if (hasRarityFilter) {
      if (!cardMatchesRarityFilter(card.rarity, rarities)) continue;
    }

    if (hasSetFilter) {
      if (!card.setCode || !sets!.includes(card.setCode)) continue;
    }

    if (hasSymbolFilter || !includeInfinityResults) {
      if (!card.symbols) {
        if (hasSymbolFilter) continue;
        continue;
      }

      const cardSymbols = card.symbols.split("|").map((s) => s.trim().toLowerCase());
      const cardHasInfinity = cardSymbols.includes("infinity");

      if (!includeInfinityResults && cardHasInfinity) continue;

      if (hasSymbolFilter) {
        let matchesSelection: boolean;
        if (symbolMatchAll) {
          matchesSelection = symbolFilters!.every((s) => cardSymbols.includes(s.toLowerCase()));
        } else {
          let tokens = cardSymbols;
          const isAttuned = cardSymbols.some((s) => s.toLowerCase().startsWith("attuned"));
          if (isAttuned && !isAttunedFilter) {
            tokens = cardSymbols.map((s) => s.replace(/^attuned[:-]?/, "").toLowerCase());
          }
          matchesSelection = symbolFilters!.some((s) => tokens.includes(s.toLowerCase()));
        }
        if (includeInfinityResults) {
          if (!matchesSelection && !cardHasInfinity) continue;
        } else {
          if (!matchesSelection) continue;
        }
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

    if (matchesStatZoneFilters && !matchesStatZoneFilters(card)) continue;

    if (matchesFacetFilters && !matchesFacetFilters(card)) continue;

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

function getSortPairComparator(
  field: string,
  multiplier: number,
  filterDefinition: GameFilterDefinition
): SortPairComparator {
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
    default:
      // Sortable stats (e.g. difficulty/control/speed/damage) come from the filter definition.
      return getStatSortComparator(filterDefinition, field, multiplier) ?? defaultCardSort;
  }
}

export function sortCards(
  cards: CachedCard[],
  options: CardSortOptions,
  filterDefinition: GameFilterDefinition
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
  const compare = getSortPairComparator(field, multiplier, filterDefinition);
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
