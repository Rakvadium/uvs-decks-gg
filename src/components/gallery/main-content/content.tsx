"use client";

import { useMemo } from "react";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";
import { GalleryCardMapProvider } from "./card-map-context";
import { GalleryDetailsView } from "./details-view";
import { GalleryGridView } from "./grid-view";
import { GalleryInitializationState } from "./initial-loading-state";
import { GalleryListView } from "./list-view";
import { GalleryStats } from "./gallery-stats";
import { LoadingProgress } from "./loading-progress";

function GalleryMainContentBody() {
  const { state, meta } = useGalleryFilters();

  const filterKey = useMemo(
    () => JSON.stringify({ search: state.search, searchMode: state.searchMode, filters: state.filters }),
    [state.search, state.searchMode, state.filters]
  );

  return (
    <div className="relative z-10 flex-1 overflow-y-auto">
      <div className="space-y-4 p-4 pb-[8rem] md:p-6 md:pb-4">
        <GalleryStats totalCards={meta.totalCards} filteredCount={meta.filteredCount} isLoading={meta.isLoadingMore} />

        {state.viewMode === "card" ? (
          <GalleryGridView key={filterKey} cards={meta.filteredCards} cardsPerRow={state.cardsPerRow} />
        ) : state.viewMode === "list" ? (
          <GalleryListView key={filterKey} cards={meta.filteredCards} />
        ) : (
          <GalleryDetailsView key={filterKey} cards={meta.filteredCards} />
        )}
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
