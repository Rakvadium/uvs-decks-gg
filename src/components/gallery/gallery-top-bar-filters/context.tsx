"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { GalleryMobileFilterPage } from "@/components/gallery/mobile-filter-sheet/context";
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
    hasClearableFilters: boolean;
  };
  isFilterPanelOpen: boolean;
  filterPanelPage: GalleryMobileFilterPage;
  setFilterPanelPage: (page: GalleryMobileFilterPage) => void;
  setFilterPanelOpen: (open: boolean) => void;
  openFilterPanel: (page?: GalleryMobileFilterPage) => void;
}

const GalleryTopBarFiltersContext = createContext<GalleryTopBarFiltersContextValue | null>(null);

export function GalleryTopBarFiltersProvider({ children }: { children: ReactNode }) {
  const filtersContext = useGalleryFiltersOptional();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterPanelPage, setFilterPanelPage] = useState<GalleryMobileFilterPage>("root");

  const setFilterPanelOpen = useCallback((open: boolean) => {
    setIsFilterPanelOpen(open);
    if (!open) setFilterPanelPage("root");
  }, []);

  const openFilterPanel = useCallback((page: GalleryMobileFilterPage = "root") => {
    setFilterPanelPage(page);
    setIsFilterPanelOpen(true);
  }, []);

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
        hasClearableFilters: filtersContext.meta.hasClearableFilters,
      },
      isFilterPanelOpen,
      filterPanelPage,
      setFilterPanelPage,
      setFilterPanelOpen,
      openFilterPanel,
    };
  }, [filtersContext, filterPanelPage, isFilterPanelOpen, openFilterPanel, setFilterPanelOpen]);

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
