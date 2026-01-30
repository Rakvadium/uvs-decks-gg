"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Loader2, UserIcon } from "lucide-react";
import { useCardData, CachedCard } from "@/lib/universus";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { CardGridItem } from "@/components/universus";
import { GalleryTopBarFilters } from "./gallery-header";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";

const CARDS_PER_PAGE = 50;

function LoadingProgress({ progress, isLoadingMore }: { progress: number; isLoadingMore: boolean }) {
  if (!isLoadingMore || progress >= 100) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-3 flex items-center gap-3 z-50">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Loading cards...</span>
        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-medium">{progress}%</span>
    </div>
  );
}


interface InfiniteCardGridProps {
  cards: CachedCard[];
}

function InfiniteCardGrid({ cards }: InfiniteCardGridProps) {
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { cards: allCards } = useCardData();
  
  const cardIdMap = useMemo(() => {
    const map = new Map<string, CachedCard>();
    for (const card of allCards) {
      map.set(card._id, card);
    }
    return map;
  }, [allCards]);
  
  const visibleCards = useMemo(() => {
    return cards.slice(0, visibleCount);
  }, [cards, visibleCount]);
  
  const hasMore = visibleCount < cards.length;
  
  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => Math.min(prev + CARDS_PER_PAGE, cards.length));
    }
  }, [hasMore, cards.length]);
  
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);
  
  return (
    <>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
        {visibleCards.map((card) => {
          const backCard = card.backCardId ? cardIdMap.get(card.backCardId) : undefined;
          return (
            <CardGridItem
              key={card._id}
              card={card}
              backCard={backCard}
            />
          );
        })}
      </div>

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {visibleCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">No cards found</p>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </>
  );
}

function ActiveDeckSidebar() {
  const { activeDeck, isLoading } = useActiveDeck();

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading deck</div>;
  }

  if (!activeDeck) {
    return <div className="p-4 text-sm text-muted-foreground">No active deck selected</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">{activeDeck.name}</h3>
        <div className="text-sm text-muted-foreground">Cards in deck: {Object.keys(activeDeck.mainQuantities).length}</div>
      </div>
    </div>
  );
}

export function GalleryView() {
  const { state, meta } = useGalleryFilters();
  const activeDeckSlotOptions = useMemo(
    () => ({ label: "Active Deck", icon: UserIcon }),
    []
  );

  useRegisterSlot("top-bar", "gallery-filters", GalleryTopBarFilters);
  useRegisterSlot("right-sidebar", "active-deck", ActiveDeckSidebar, activeDeckSlotOptions);

  const filterKey = useMemo(
    () => JSON.stringify({ search: state.search, searchMode: state.searchMode, filters: state.filters }),
    [state.search, state.searchMode, state.filters]
  );

  if (meta.isLoading && meta.totalCards === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading card data…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <InfiniteCardGrid key={filterKey} cards={meta.filteredCards} />
      </div>

      <LoadingProgress progress={meta.loadProgress} isLoadingMore={meta.isLoadingMore} />
    </div>
  );
}

export { GalleryView as UniversusGalleryView };
