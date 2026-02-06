"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";

type SearchMode = "name" | "text" | "all";

interface GalleryTopBarFiltersContextValue {
  state: {
    search: string;
    searchMode: SearchMode;
    viewMode: "card" | "list" | "details";
    cardsPerRow: number;
  };
  actions: {
    setSearch: (value: string) => void;
    setSearchMode: (mode: SearchMode) => void;
    setViewMode: (mode: "card" | "list" | "details") => void;
    setCardsPerRow: (value: number) => void;
    clearAllFilters: () => void;
  };
  meta: {
    activeFilterCount: number;
  };
  isFilterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
}

const GalleryTopBarFiltersContext = createContext<GalleryTopBarFiltersContextValue | null>(null);

export function GalleryTopBarFiltersProvider({ children }: { children: ReactNode }) {
  const filtersContext = useGalleryFiltersOptional();
  const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);

  const value = useMemo((): GalleryTopBarFiltersContextValue | null => {
    if (!filtersContext) return null;

    return {
      state: {
        search: filtersContext.state.search,
        searchMode: filtersContext.state.searchMode,
        viewMode: filtersContext.state.viewMode,
        cardsPerRow: filtersContext.state.cardsPerRow,
      },
      actions: {
        setSearch: filtersContext.actions.setSearch,
        setSearchMode: filtersContext.actions.setSearchMode,
        setViewMode: filtersContext.actions.setViewMode,
        setCardsPerRow: filtersContext.actions.setCardsPerRow,
        clearAllFilters: filtersContext.actions.clearAllFilters,
      },
      meta: {
        activeFilterCount: filtersContext.meta.activeFilterCount,
      },
      isFilterPanelOpen,
      setFilterPanelOpen,
    };
  }, [filtersContext, isFilterPanelOpen]);

  if (!value) return null;

  return <GalleryTopBarFiltersContext.Provider value={value}>{children}</GalleryTopBarFiltersContext.Provider>;
}

export function useGalleryTopBarFiltersContext() {
  const context = useContext(GalleryTopBarFiltersContext);

  if (!context) {
    throw new Error("useGalleryTopBarFiltersContext must be used within GalleryTopBarFiltersProvider");
  }

  return context;
}
