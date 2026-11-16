"use client";

import { useCallback, useState } from "react";
import type { CachedCard } from "@/lib/universus/card-store";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";
import { FloatingPageLayout } from "@/components/shell/floating-page-bar";
import { FilterTokens, GalleryToolbarProvider, GalleryTopBarFilters } from "../gallery-top-bar-filters";
import { GalleryCardMapProvider, useGalleryCardMap } from "./card-map-context";
import { GalleryDetailsView } from "./details-view";
import { GalleryGridView } from "./grid-view";
import { GalleryInitializationState } from "./initial-loading-state";
import { GalleryListView } from "./list-view";
import { GalleryMainScrollRootProvider, useGalleryMainScrollSetRef } from "./gallery-main-scroll-root";
import { LoadingProgress } from "./loading-progress";
import { useGameModule } from "@/games/game-context";

function GalleryMainContentBody() {
  const { CardDetailsDialog } = useGameModule().ui;
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
    <FloatingPageLayout bar={<GalleryTopBarFilters />} pageWash="glow" scrollRef={setScrollRef}>
      {isMobile ? null : <FilterTokens centered className="mb-4" />}
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

      <CardDetailsDialog
        card={detailsCard}
        backCard={detailsCard ? (getBackCard(detailsCard) ?? undefined) : undefined}
        open={detailsOpen}
        onOpenChange={handleDetailsOpenChange}
        cards={meta.filteredCards}
        getBackCard={getBackCard}
      />
    </FloatingPageLayout>
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
    <>
      <GalleryCardMapProvider>
        <GalleryMainScrollRootProvider>
          <GalleryToolbarProvider>
            <GalleryMainContentBody />
          </GalleryToolbarProvider>
        </GalleryMainScrollRootProvider>
      </GalleryCardMapProvider>

      <LoadingProgress progress={meta.loadProgress} isLoadingMore={meta.isLoadingMore} />
    </>
  );
}

export { GalleryMainContent as UniversusGalleryMainContent };
