"use client";

import { useCallback, useState } from "react";
import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
import type { CachedCard } from "@/lib/universus/card-store";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";
import { cn } from "@/lib/utils";
import { GalleryTopBarFilters } from "../gallery-top-bar-filters";
import { GalleryCardMapProvider, useGalleryCardMap } from "./card-map-context";
import { GalleryDetailsView } from "./details-view";
import { GalleryGridView } from "./grid-view";
import { GalleryInitializationState } from "./initial-loading-state";
import { GalleryListView } from "./list-view";
import { GalleryMainScrollRootProvider, useGalleryMainScrollSetRef } from "./gallery-main-scroll-root";
import { LoadingProgress } from "./loading-progress";

function GalleryMainContentBody() {
  const { state, meta } = useGalleryFilters();
  const { getBackCard } = useGalleryCardMap();
  const [detailsCard, setDetailsCard] = useState<CachedCard | null>(null);
  const filterKey = meta.filteredListKey;
  const setScrollRef = useGalleryMainScrollSetRef();
  const isMobile = useIsMobile();

  const openCardDetails = useCallback((card: CachedCard) => {
    setDetailsCard(card);
  }, []);

  const handleDetailsOpenChange = useCallback((open: boolean) => {
    if (!open) setDetailsCard(null);
  }, []);

  const detailsOpen = detailsCard !== null;

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      {!isMobile ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-3 md:px-6">
          <GalleryTopBarFilters />
        </div>
      ) : null}

      <div
        ref={setScrollRef}
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      >
        <div
          className={cn(
            "p-4 pb-6 md:px-6 md:pb-4 md:pt-[4.75rem]",
            "max-md:pt-[calc(var(--mobile-nav-h,3.5rem)+0.75rem)] max-md:pb-[calc(var(--mobile-tab-h,5rem)+1rem)]"
          )}
        >
          {state.viewMode === "card" ? (
            <GalleryGridView
              key={filterKey}
              cards={meta.filteredCards}
              cardsPerRow={state.cardsPerRow}
              onOpenCardDetails={openCardDetails}
            />
          ) : state.viewMode === "list" ? (
            <GalleryListView
              key={filterKey}
              cards={meta.filteredCards}
              onOpenCardDetails={openCardDetails}
            />
          ) : (
            <GalleryDetailsView
              key={filterKey}
              cards={meta.filteredCards}
              onOpenCardDetails={openCardDetails}
            />
          )}
        </div>
      </div>

      <CardDetailsDialog
        card={detailsCard}
        backCard={detailsCard ? (getBackCard(detailsCard) ?? undefined) : undefined}
        open={detailsOpen}
        onOpenChange={handleDetailsOpenChange}
        cards={meta.filteredCards}
        getBackCard={getBackCard}
      />
    </div>
  );
}

export function GalleryMainContent() {
  const { meta } = useGalleryFilters();

  if (!meta.isCatalogIndexReady) {
    return <GalleryInitializationState />;
  }

  if (
    meta.totalCards === 0 &&
    (meta.isLoading ||
      meta.isLoadingMore ||
      meta.isCatalogDataLoading ||
      meta.isCheckingVersion ||
      meta.isSyncing)
  ) {
    return <GalleryInitializationState />;
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-secondary/3 blur-3xl" />
      </div>

      <GalleryCardMapProvider>
        <GalleryMainScrollRootProvider>
          <GalleryMainContentBody />
        </GalleryMainScrollRootProvider>
      </GalleryCardMapProvider>

      <LoadingProgress progress={meta.loadProgress} isLoadingMore={meta.isLoadingMore} />
    </div>
  );
}

export { GalleryMainContent as UniversusGalleryMainContent };
