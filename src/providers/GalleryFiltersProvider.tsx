"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useDeferredValue,
  useRef,
  startTransition,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCardCatalog, useCardReferenceData } from "@/lib/universus/card-data-provider";
import { sortCards } from "@/lib/universus/use-universus-cards";
import type { CachedCard } from "@/lib/universus/card-store";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLocationSearchParams } from "@/hooks/useLocationSearchParams";
import { useUIState, type CardFilters, type GalleryViewMode } from "@/providers/UIStateProvider";
import { clampGalleryCardsPerRow } from "@/lib/gallery/cards-per-row-preference";
import {
  fromGalleryViewMode,
  galleryUrlHasState,
  parseGalleryUrlState,
  stripSearchFields,
  toGalleryViewMode,
  writeGalleryUrlState,
  type GallerySearchMode,
  type GalleryUiViewMode,
} from "@/lib/gallery/url-state";

type SearchMode = GallerySearchMode;
type ViewMode = GalleryUiViewMode;

interface GalleryFiltersState {
  search: string;
  searchMode: SearchMode;
  filters: CardFilters;
  effectiveFormat: string;
  viewMode: ViewMode;
  cardsPerRow: number;
}

interface GalleryFiltersActions {
  setSearch: (search: string) => void;
  setSearchMode: (mode: SearchMode) => void;
  updateFilter: <K extends keyof CardFilters>(key: K, value: CardFilters[K]) => void;
  removeFilterKeys: (keys: (keyof CardFilters)[]) => void;
  clearAllFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setCardsPerRow: (count: number) => void;
}

interface GalleryFiltersMeta {
  totalCards: number;
  filteredCount: number;
  filteredCards: CachedCard[];
  filteredListKey: string;
  uniqueValues: ReturnType<typeof useCardCatalog>["uniqueValues"];
  formats: Array<{ key: string; name: string }>;
  defaultFormatKey: string;
  activeFilterCount: number;
  hasClearableFilters: boolean;
  isLoading: boolean;
  isCatalogDataLoading: boolean;
  isCatalogIndexReady: boolean;
  isLoadingMore: boolean;
  loadProgress: number;
  isCheckingVersion: boolean;
  isSyncing: boolean;
}

interface GalleryFiltersContextValue {
  state: GalleryFiltersState;
  actions: GalleryFiltersActions;
  meta: GalleryFiltersMeta;
}

const GalleryFiltersContext = createContext<GalleryFiltersContextValue | null>(null);

function isGalleryPath(pathname: string) {
  return pathname === "/gallery" || pathname.startsWith("/gallery/");
}

export function GalleryFiltersProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { params: searchParams, replaceParams } = useLocationSearchParams();
  const syncUrl = isGalleryPath(pathname);
  const skipUrlReadRef = useRef(false);
  const {
    uiState,
    setGalleryFilters,
    setGalleryViewMode,
    setGalleryCardsPerRow,
    setGallerySortField,
    setGallerySortDirection,
  } = useUIState();
  const isMobile = useIsMobile();
  const {
    isLoading,
    isCatalogDataLoading,
    isCatalogIndexReady,
    isLoadingMore,
    loadProgress,
    isCheckingVersion,
    isSyncing,
    uniqueValues,
    getFilteredCards,
    totalCards: catalogTotalCards,
  } = useCardCatalog();
  const { formats } = useCardReferenceData();
  const [search, setSearchState] = useState("");
  const [searchMode, setSearchModeState] = useState<SearchMode>("all");

  const viewMode: ViewMode = useMemo(() => {
    return fromGalleryViewMode(uiState.galleryViewMode);
  }, [uiState.galleryViewMode]);
  const cardsPerRow = useMemo(() => {
    const minCardsPerRow = isMobile ? 1 : 3;
    const maxCardsPerRow = isMobile ? 2 : 10;
    const fallback = isMobile ? 2 : 6;
    return clampGalleryCardsPerRow(
      uiState.galleryCardsPerRow,
      fallback,
      minCardsPerRow,
      maxCardsPerRow
    );
  }, [uiState.galleryCardsPerRow, isMobile]);

  const galleryFilters = useMemo(() => uiState.galleryFilters ?? {}, [uiState.galleryFilters]);
  const defaultFormat = formats.find((format) => format.isDefault)?.key ?? "standard";
  const effectiveFormat = galleryFilters.format ?? defaultFormat;
  const sortField = uiState.gallerySortField ?? "default";
  const sortDirection = (uiState.gallerySortDirection ?? "asc") as "asc" | "desc";

  const replaceGalleryUrl = useCallback(
    (next: {
      search: string;
      searchMode: SearchMode;
      filters: CardFilters;
      viewMode: ViewMode;
      sortField: string;
      sortDirection: "asc" | "desc";
    }) => {
      if (!syncUrl) return;
      if (typeof window === "undefined") return;
      const payload = {
        ...next,
        filters: stripSearchFields(next.filters),
        defaultFormatKey: defaultFormat,
      };
      const liveParams = new URLSearchParams(window.location.search);
      const nextGalleryQuery = writeGalleryUrlState(new URLSearchParams(), payload).toString();
      const currentParsed = parseGalleryUrlState(liveParams);
      const currentGalleryQuery = writeGalleryUrlState(new URLSearchParams(), {
        search: currentParsed.search ?? "",
        searchMode: currentParsed.searchMode ?? "all",
        filters: currentParsed.filters ?? {},
        viewMode: currentParsed.viewMode ?? "card",
        sortField: currentParsed.sortField ?? "default",
        sortDirection: currentParsed.sortDirection ?? "asc",
        defaultFormatKey: defaultFormat,
      }).toString();
      if (nextGalleryQuery === currentGalleryQuery) return;

      const written = writeGalleryUrlState(liveParams, payload);
      const nextQuery = written.toString();
      skipUrlReadRef.current = true;
      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      window.history.replaceState(window.history.state, "", nextHref);
      replaceParams(written);
      startTransition(() => {
        router.replace(nextHref, { scroll: false });
      });
    },
    [syncUrl, defaultFormat, pathname, router, replaceParams]
  );

  useEffect(() => {
    if (!syncUrl) return;
    if (skipUrlReadRef.current) {
      skipUrlReadRef.current = false;
      return;
    }
    if (!galleryUrlHasState(searchParams)) {
      setSearchState("");
      setSearchModeState("all");
      return;
    }
    const parsed = parseGalleryUrlState(searchParams);
    setSearchState(parsed.search ?? "");
    setSearchModeState(parsed.searchMode ?? "all");
    if (parsed.filters) setGalleryFilters(stripSearchFields(parsed.filters));
    if (parsed.viewMode) setGalleryViewMode(toGalleryViewMode(parsed.viewMode));
    if (parsed.sortField) setGallerySortField(parsed.sortField);
    if (parsed.sortDirection) setGallerySortDirection(parsed.sortDirection);
  }, [
    syncUrl,
    searchParams,
    setGalleryFilters,
    setGalleryViewMode,
    setGallerySortField,
    setGallerySortDirection,
  ]);

  const handleSetViewMode = useCallback(
    (mode: ViewMode) => {
      const mapped: GalleryViewMode = toGalleryViewMode(mode);
      setGalleryViewMode(mapped);
      replaceGalleryUrl({
        search,
        searchMode,
        filters: galleryFilters,
        viewMode: mode,
        sortField,
        sortDirection,
      });
    },
    [
      setGalleryViewMode,
      replaceGalleryUrl,
      search,
      searchMode,
      galleryFilters,
      sortField,
      sortDirection,
    ]
  );

  const handleSetCardsPerRow = useCallback(
    (count: number) => {
      const minCardsPerRow = isMobile ? 1 : 3;
      const maxCardsPerRow = isMobile ? 2 : 10;
      const next = clampGalleryCardsPerRow(count, isMobile ? 2 : 6, minCardsPerRow, maxCardsPerRow);
      setGalleryCardsPerRow(next);
    },
    [setGalleryCardsPerRow, isMobile]
  );

  useEffect(() => {
    if (isMobile && viewMode === "details") {
      handleSetViewMode("list");
    }
  }, [isMobile, viewMode, handleSetViewMode]);

  const filters = useMemo(
    () => ({
      ...galleryFilters,
      search,
      searchMode,
      format: effectiveFormat,
    }),
    [galleryFilters, search, searchMode, effectiveFormat]
  );

  const sortOptions = useMemo(
    () => ({
      field: sortField,
      direction: sortDirection,
    }),
    [sortField, sortDirection]
  );

  const deferredSearch = useDeferredValue(search);
  const deferredSearchMode = useDeferredValue(searchMode);
  const deferredGalleryFilters = useDeferredValue(galleryFilters);
  const deferredSortOptions = useDeferredValue(sortOptions);

  const pipelineEffectiveFormat = useMemo(
    () => deferredGalleryFilters.format ?? defaultFormat,
    [deferredGalleryFilters, defaultFormat]
  );

  const pipelineFilters = useMemo(
    () => ({
      ...deferredGalleryFilters,
      search: deferredSearch,
      searchMode: deferredSearchMode,
      format: pipelineEffectiveFormat,
    }),
    [deferredGalleryFilters, deferredSearch, deferredSearchMode, pipelineEffectiveFormat]
  );

  const filteredCards = useMemo(() => {
    const filtered = getFilteredCards(pipelineFilters);
    return sortCards(filtered, deferredSortOptions);
  }, [getFilteredCards, pipelineFilters, deferredSortOptions]);

  const filteredListKey = useMemo(
    () =>
      JSON.stringify({
        filters: pipelineFilters,
        sort: deferredSortOptions,
      }),
    [pipelineFilters, deferredSortOptions]
  );

  const formatsForSelect = useMemo(
    () => formats.map((format) => ({ key: format.key, name: format.name })),
    [formats]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (galleryFilters.format && galleryFilters.format !== defaultFormat) count++;
    if (filters.type?.length) count++;
    if (filters.rarity?.length) count++;
    if (filters.set?.length) count++;
    if (galleryFilters.symbols !== undefined && galleryFilters.symbols.length > 0) count++;
    if (galleryFilters.includeInfinity === false) count++;
    if (filters.keywords?.length) count++;
    if (filters.difficultyMin !== undefined || filters.difficultyMax !== undefined) count++;
    if (filters.controlMin !== undefined || filters.controlMax !== undefined) count++;
    return count;
  }, [filters, galleryFilters, defaultFormat]);

  const hasClearableFilters = activeFilterCount > 0 || search.trim().length > 0;

  const setSearch = useCallback(
    (nextSearch: string) => {
      setSearchState(nextSearch);
      replaceGalleryUrl({
        search: nextSearch,
        searchMode,
        filters: galleryFilters,
        viewMode,
        sortField,
        sortDirection,
      });
    },
    [replaceGalleryUrl, searchMode, galleryFilters, viewMode, sortField, sortDirection]
  );

  const setSearchMode = useCallback(
    (mode: SearchMode) => {
      setSearchModeState(mode);
      replaceGalleryUrl({
        search,
        searchMode: mode,
        filters: galleryFilters,
        viewMode,
        sortField,
        sortDirection,
      });
    },
    [replaceGalleryUrl, search, galleryFilters, viewMode, sortField, sortDirection]
  );

  const updateFilter = useCallback(
    <K extends keyof CardFilters>(key: K, value: CardFilters[K]) => {
      startTransition(() => {
        const nextFilters: CardFilters = { ...galleryFilters };
        if (value === undefined || (Array.isArray(value) && value.length === 0)) {
          delete nextFilters[key];
        } else {
          nextFilters[key] = value;
        }
        setGalleryFilters(nextFilters);
        replaceGalleryUrl({
          search,
          searchMode,
          filters: nextFilters,
          viewMode,
          sortField,
          sortDirection,
        });
      });
    },
    [
      galleryFilters,
      setGalleryFilters,
      replaceGalleryUrl,
      search,
      searchMode,
      viewMode,
      sortField,
      sortDirection,
    ]
  );

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      setSearchState("");
      setSearchModeState("all");
      setGalleryFilters({});
      replaceGalleryUrl({
        search: "",
        searchMode: "all",
        filters: {},
        viewMode,
        sortField,
        sortDirection,
      });
    });
  }, [
    setGalleryFilters,
    replaceGalleryUrl,
    viewMode,
    sortField,
    sortDirection,
  ]);

  const removeFilterKeys = useCallback(
    (keys: (keyof CardFilters)[]) => {
      startTransition(() => {
        const nextFilters: CardFilters = { ...galleryFilters };
        for (const key of keys) {
          delete nextFilters[key];
        }
        setGalleryFilters(nextFilters);
        replaceGalleryUrl({
          search,
          searchMode,
          filters: nextFilters,
          viewMode,
          sortField,
          sortDirection,
        });
      });
    },
    [
      galleryFilters,
      setGalleryFilters,
      replaceGalleryUrl,
      search,
      searchMode,
      viewMode,
      sortField,
      sortDirection,
    ]
  );

  const value = useMemo(
    (): GalleryFiltersContextValue => ({
      state: {
        search,
        searchMode,
        filters,
        effectiveFormat,
        viewMode,
        cardsPerRow,
      },
      actions: {
        setSearch,
        setSearchMode,
        updateFilter,
        removeFilterKeys,
        clearAllFilters,
        setViewMode: handleSetViewMode,
        setCardsPerRow: handleSetCardsPerRow,
      },
      meta: {
        totalCards: catalogTotalCards,
        filteredCount: filteredCards.length,
        filteredCards,
        filteredListKey,
        uniqueValues,
        formats: formatsForSelect,
        defaultFormatKey: defaultFormat,
        activeFilterCount,
        hasClearableFilters,
        isLoading,
        isCatalogDataLoading,
        isCatalogIndexReady,
        isLoadingMore,
        loadProgress,
        isCheckingVersion,
        isSyncing,
      },
    }),
    [
      search,
      searchMode,
      filters,
      effectiveFormat,
      viewMode,
      cardsPerRow,
      setSearch,
      setSearchMode,
      updateFilter,
      removeFilterKeys,
      clearAllFilters,
      handleSetViewMode,
      handleSetCardsPerRow,
      catalogTotalCards,
      filteredCards,
      filteredListKey,
      uniqueValues,
      formatsForSelect,
      defaultFormat,
      activeFilterCount,
      hasClearableFilters,
      isLoading,
      isCatalogDataLoading,
      isCatalogIndexReady,
      isLoadingMore,
      loadProgress,
      isCheckingVersion,
      isSyncing,
    ]
  );

  return (
    <GalleryFiltersContext.Provider value={value}>
      {children}
    </GalleryFiltersContext.Provider>
  );
}

export function useGalleryFilters(): GalleryFiltersContextValue {
  const context = useContext(GalleryFiltersContext);
  if (!context) {
    throw new Error("useGalleryFilters must be used within GalleryFiltersProvider");
  }
  return context;
}

export function useGalleryFiltersOptional(): GalleryFiltersContextValue | null {
  return useContext(GalleryFiltersContext);
}
