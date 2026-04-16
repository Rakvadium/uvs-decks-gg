"use client";

import { useMemo } from "react";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";
import { GalleryTopBarFilters } from "../gallery-top-bar-filters";
import { GalleryCardMapProvider } from "./card-map-context";
import { GalleryDetailsView } from "./details-view";
import { GalleryGridView } from "./grid-view";
import { GalleryInitializationState } from "./initial-loading-state";
import { GalleryListView } from "./list-view";
import { LoadingProgress } from "./loading-progress";

function GalleryMainContentBody() {
  const { state, meta } = useGalleryFilters();

  const filterKey = useMemo(
    () => JSON.stringify({ search: state.search, searchMode: state.searchMode, filters: state.filters }),
    [state.search, state.searchMode, state.filters]
  );

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="relative z-30 hidden shrink-0 border-b border-border/40 bg-background/85 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:block">
        <div className="w-full px-4 py-2 md:px-6">
          <GalleryTopBarFilters />
        </div>
      </div>

      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 pb-6 md:px-6 md:pb-4 md:pt-4">
          {state.viewMode === "card" ? (
            <GalleryGridView key={filterKey} cards={meta.filteredCards} cardsPerRow={state.cardsPerRow} />
          ) : state.viewMode === "list" ? (
            <GalleryListView key={filterKey} cards={meta.filteredCards} />
          ) : (
            <GalleryDetailsView key={filterKey} cards={meta.filteredCards} />
          )}
        </div>
      </div>
    </div>
  );
}

export function GalleryMainContent() {
  const { meta } = useGalleryFilters();

  if (meta.isLoading && meta.totalCards === 0) {
    return <GalleryInitializationState />;
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-secondary/3 blur-3xl" />
      </div>

      <GalleryCardMapProvider>
        <GalleryMainContentBody />
      </GalleryCardMapProvider>

      <LoadingProgress progress={meta.loadProgress} isLoadingMore={meta.isLoadingMore} />
    </div>
  );
}

export { GalleryMainContent as UniversusGalleryMainContent };
