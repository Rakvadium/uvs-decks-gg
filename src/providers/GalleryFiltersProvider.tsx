"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { useCardData, sortCards, CachedCard } from "@/lib/universus";
import { useUIState, type CardFilters } from "@/providers/UIStateProvider";

type SearchMode = "name" | "text" | "all";

interface GalleryFiltersState {
  search: string;
  searchMode: SearchMode;
  filters: CardFilters;
  effectiveFormat: string;
}

interface GalleryFiltersActions {
  setSearch: (search: string) => void;
  setSearchMode: (mode: SearchMode) => void;
  updateFilter: <K extends keyof CardFilters>(key: K, value: CardFilters[K]) => void;
  clearAllFilters: () => void;
}

interface GalleryFiltersMeta {
  totalCards: number;
  filteredCount: number;
  filteredCards: CachedCard[];
  uniqueValues: ReturnType<typeof useCardData>["uniqueValues"];
  formats: Array<{ key: string; name: string }>;
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
  const { uiState, setGalleryFilters } = useUIState();
  const {
    cards,
    isLoading,
    isLoadingMore,
    loadProgress,
    uniqueValues,
    formats,
    getFilteredCards,
  } = useCardData();
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("name");

  const galleryFilters = uiState.galleryFilters ?? {};
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
      direction: (uiState.gallerySortDirection ?? "asc") as const,
    }),
    [uiState.gallerySortField, uiState.gallerySortDirection]
  );

  const filteredCards = useMemo(() => {
    const filtered = getFilteredCards(filters);
    return sortCards(filtered, sortOptions);
  }, [getFilteredCards, filters, sortOptions]);

  const formatsForSelect = useMemo(
    () => formats.map((format) => ({ key: format.key, name: format.name })),
    [formats]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.format) count++;
    if (filters.type?.length) count++;
    if (filters.rarity?.length) count++;
    if (filters.set?.length) count++;
    if (filters.symbols?.length) count++;
    if (filters.keywords?.length) count++;
    if (filters.difficultyMin !== undefined || filters.difficultyMax !== undefined) count++;
    if (filters.controlMin !== undefined || filters.controlMax !== undefined) count++;
    return count;
  }, [filters]);

  const updateFilter = useCallback(
    <K extends keyof CardFilters>(key: K, value: CardFilters[K]) => {
      const nextFilters: CardFilters = { ...galleryFilters };
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete nextFilters[key];
      } else {
        nextFilters[key] = value;
      }
      setGalleryFilters(nextFilters);
    },
    [galleryFilters, setGalleryFilters]
  );

  const clearAllFilters = useCallback(() => {
    setGalleryFilters({});
  }, [setGalleryFilters]);

  const value = useMemo(
    (): GalleryFiltersContextValue => ({
      state: {
        search,
        searchMode,
        filters,
        effectiveFormat,
      },
      actions: {
        setSearch,
        setSearchMode,
        updateFilter,
        clearAllFilters,
      },
      meta: {
        totalCards: cards.length,
        filteredCount: filteredCards.length,
        filteredCards,
        uniqueValues,
        formats: formatsForSelect,
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
      updateFilter,
      clearAllFilters,
      cards.length,
      filteredCards,
      uniqueValues,
      formatsForSelect,
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
