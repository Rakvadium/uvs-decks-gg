"use client";

import { useCallback, useState } from "react";
import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
import type { CachedCard } from "@/lib/universus/card-store";
import { useInfiniteSlice } from "@/hooks/useInfiniteSlice";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";
import { GalleryTopBarFilters } from "../gallery-top-bar-filters";
import { GalleryCardMapProvider, useGalleryCardMap } from "./card-map-context";
import { GalleryDetailsView } from "./details-view";
import { GalleryGridView } from "./grid-view";
import { GalleryInitializationState } from "./initial-loading-state";
import { GalleryListView } from "./list-view";
import { GalleryMainScrollRootProvider, useGalleryMainScrollRootRef, useGalleryMainScrollSetRef } from "./gallery-main-scroll-root";
import { LoadMoreIndicator } from "./load-more-indicator";
import { LoadingProgress } from "./loading-progress";

const GALLERY_SLICE_PAGE = 72;

function GalleryMainContentBody() {
  const { state, meta } = useGalleryFilters();
  const { getBackCard } = useGalleryCardMap();
  const [detailsCard, setDetailsCard] = useState<CachedCard | null>(null);
  const filterKey = meta.filteredListKey;
  const scrollRef = useGalleryMainScrollRootRef();
  const setScrollRef = useGalleryMainScrollSetRef();
  const isMobile = useIsMobile();
  const {
    visibleItems: visibleFilteredCards,
    hasMore,
    loadMoreRef,
  } = useInfiniteSlice({
    items: meta.filteredCards,
    pageSize: GALLERY_SLICE_PAGE,
    resetKey: meta.filteredListKey,
    rootRef: scrollRef,
    rootMargin: isMobile ? "480px" : "720px",
  });

  const openCardDetails = useCallback((card: CachedCard) => {
    setDetailsCard(card);
  }, []);

  const handleDetailsOpenChange = useCallback((open: boolean) => {
    if (!open) setDetailsCard(null);
  }, []);

  const detailsOpen = detailsCard !== null;

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="relative z-30 hidden shrink-0 border-b border-primary/40 bg-primary/15 shadow-[0_1px_0_color-mix(in_oklch,var(--primary)_12%,transparent)] md:block dark:border-sidebar-border/50 dark:bg-sidebar dark:shadow-none">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 dark:hidden" />
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{ background: "var(--chrome-shell-sidebar-wash)" }}
        />
        <div className="relative w-full px-4 py-3 md:px-6">
          <GalleryTopBarFilters />
        </div>
      </div>

      <div ref={setScrollRef} className="relative z-0 min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 pb-6 md:px-6 md:pb-4 md:pt-4">
          {state.viewMode === "card" ? (
            <GalleryGridView
              key={filterKey}
              cards={visibleFilteredCards}
              cardsPerRow={state.cardsPerRow}
              onOpenCardDetails={openCardDetails}
            />
          ) : state.viewMode === "list" ? (
            <GalleryListView key={filterKey} cards={visibleFilteredCards} onOpenCardDetails={openCardDetails} />
          ) : (
            <GalleryDetailsView key={filterKey} cards={visibleFilteredCards} onOpenCardDetails={openCardDetails} />
          )}
        </div>
        {hasMore ? <LoadMoreIndicator loadMoreRef={loadMoreRef} /> : null}
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
