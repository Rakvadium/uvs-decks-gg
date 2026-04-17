"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useDeferredValue,
  startTransition,
  ReactNode,
} from "react";
import { useCardCatalog, useCardReferenceData } from "@/lib/universus/card-data-provider";
import { sortCards } from "@/lib/universus/use-universus-cards";
import type { CachedCard } from "@/lib/universus/card-store";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useUIState, type CardFilters, type GalleryViewMode } from "@/providers/UIStateProvider";
import { useActiveSidebarActionId } from "@/components/shell/shell-slot-provider";

type SearchMode = "name" | "text" | "all";
type ViewMode = "card" | "list" | "details";

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
  isLoading: boolean;
  isLoadingMore: boolean;
  loadProgress: number;
}

interface GalleryFiltersContextValue {
  state: GalleryFiltersState;
  actions: GalleryFiltersActions;
  meta: GalleryFiltersMeta;
}

const GalleryFiltersContext = createContext<GalleryFiltersContextValue | null>(null);

export function GalleryFiltersProvider({ children }: { children: ReactNode }) {
  const { uiState, setGalleryFilters, setGalleryViewMode, setGalleryCardsPerRow } = useUIState();
  const activeSidebarActionId = useActiveSidebarActionId();
  const isMobile = useIsMobile();
  const {
    cards,
    isLoading,
    isLoadingMore,
    loadProgress,
    uniqueValues,
    getFilteredCards,
  } = useCardCatalog();
  const { formats } = useCardReferenceData();
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("all");
  const isSidebarOpen = useMemo(() => Boolean(activeSidebarActionId), [activeSidebarActionId]);
  const deferredIsSidebarOpen = useDeferredValue(isSidebarOpen);
  const viewMode: ViewMode = useMemo(() => {
    const storedMode = uiState.galleryViewMode;
    if (storedMode === "grid") return "card";
    if (storedMode === "list" || storedMode === "details") return storedMode;
    return "card";
  }, [uiState.galleryViewMode]);
  const cardsPerRow = useMemo(() => {
    const minCardsPerRow = isMobile ? 1 : 3;
    const maxCardsPerRow = isMobile ? 2 : 10;
    const clampCardsPerRow = (value: number | undefined, fallback: number) => {
      const raw = typeof value === "number" ? value : fallback;
      if (Number.isNaN(raw)) return fallback;
      return Math.min(maxCardsPerRow, Math.max(minCardsPerRow, Math.round(raw)));
    };

    const legacy = uiState.galleryCardsPerRow;
    const openDefault = isMobile ? 1 : 4;
    const closedDefault = isMobile ? 2 : 6;
    const openValue = clampCardsPerRow(uiState.galleryCardsPerRowOpen ?? legacy, openDefault);
    const closedValue = clampCardsPerRow(uiState.galleryCardsPerRowClosed ?? legacy, closedDefault);

    return deferredIsSidebarOpen ? openValue : closedValue;
  }, [
    uiState.galleryCardsPerRow,
    uiState.galleryCardsPerRowOpen,
    uiState.galleryCardsPerRowClosed,
    deferredIsSidebarOpen,
    isMobile,
  ]);

  const handleSetViewMode = useCallback(
    (mode: ViewMode) => {
      const mapped: GalleryViewMode = mode === "card" ? "grid" : mode;
      setGalleryViewMode(mapped);
    },
    [setGalleryViewMode]
  );

  const handleSetCardsPerRow = useCallback(
    (count: number) => {
      const minCardsPerRow = isMobile ? 1 : 3;
      const maxCardsPerRow = isMobile ? 2 : 10;
      const next = Math.min(maxCardsPerRow, Math.max(minCardsPerRow, Math.round(count)));
      setGalleryCardsPerRow(next, isSidebarOpen);
    },
    [setGalleryCardsPerRow, isSidebarOpen, isMobile]
  );

  useEffect(() => {
    if (isMobile && viewMode === "details") {
      handleSetViewMode("list");
    }
  }, [isMobile, viewMode, handleSetViewMode]);

  const galleryFilters = useMemo(() => uiState.galleryFilters ?? {}, [uiState.galleryFilters]);
  const defaultFormat = formats.find((format) => format.isDefault)?.key ?? "standard";
  const effectiveFormat = galleryFilters.format ?? defaultFormat;

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
      field: uiState.gallerySortField ?? "default",
      direction: (uiState.gallerySortDirection ?? "asc") as "asc" | "desc",
    }),
    [uiState.gallerySortField, uiState.gallerySortDirection]
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
    if (filters.symbols?.length) count++;
    if (filters.keywords?.length) count++;
    if (filters.difficultyMin !== undefined || filters.difficultyMax !== undefined) count++;
    if (filters.controlMin !== undefined || filters.controlMax !== undefined) count++;
    return count;
  }, [filters, galleryFilters.format, defaultFormat]);

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
      });
    },
    [galleryFilters, setGalleryFilters]
  );

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      setGalleryFilters({});
    });
  }, [setGalleryFilters]);

  const removeFilterKeys = useCallback(
    (keys: (keyof CardFilters)[]) => {
      startTransition(() => {
        const nextFilters: CardFilters = { ...galleryFilters };
        for (const key of keys) {
          delete nextFilters[key];
        }
        setGalleryFilters(nextFilters);
      });
    },
    [galleryFilters, setGalleryFilters]
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
        totalCards: cards.length,
        filteredCount: filteredCards.length,
        filteredCards,
        filteredListKey,
        uniqueValues,
        formats: formatsForSelect,
        defaultFormatKey: defaultFormat,
        activeFilterCount,
        isLoading,
        isLoadingMore,
        loadProgress,
      },
    }),
    [
      search,
      searchMode,
      filters,
      effectiveFormat,
      viewMode,
      cardsPerRow,
      updateFilter,
      removeFilterKeys,
      clearAllFilters,
      handleSetViewMode,
      handleSetCardsPerRow,
      cards.length,
      filteredCards,
      filteredListKey,
      uniqueValues,
      formatsForSelect,
      defaultFormat,
      activeFilterCount,
      isLoading,
      isLoadingMore,
      loadProgress,
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
