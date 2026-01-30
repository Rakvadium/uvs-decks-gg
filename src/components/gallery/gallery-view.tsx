"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Loader2, UserIcon, Hexagon, Database, LayoutGrid, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useCardData, CachedCard } from "@/lib/universus";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { CardGridItem } from "@/components/universus";
import { GalleryTopBarFilters } from "./gallery-header";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { Badge } from "@/components/ui/badge";

const CARDS_PER_PAGE = 50;

function LoadingProgress({ progress, isLoadingMore }: { progress: number; isLoadingMore: boolean }) {
  if (!isLoadingMore || progress >= 100) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-card/95 backdrop-blur-lg border border-primary/30 rounded-lg shadow-[0_0_30px_-5px_var(--primary)] p-4 flex items-center gap-4 z-50">
      <div className="relative">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-primary/20" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Syncing Database</span>
        <div className="w-44 h-2 bg-muted/50 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ boxShadow: "0 0 10px var(--primary)" }}
          />
        </div>
      </div>
      <span className="text-sm font-mono font-bold text-primary">{progress}%</span>
    </div>
  );
}

function GalleryStats({ totalCards, filteredCount, isLoading }: { totalCards: number; filteredCount: number; isLoading: boolean }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <motion.div 
      initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-2 py-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
          <Database className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-display font-bold text-foreground leading-none">
            {filteredCount.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {filteredCount === totalCards ? "Total Cards" : `of ${totalCards.toLocaleString()}`}
          </span>
        </div>
      </div>
      
      <div className="h-8 w-px bg-border/50" />
      
      <div className="flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading</span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ready</span>
          </>
        )}
      </div>
    </motion.div>
  );
}

interface InfiniteCardGridProps {
  cards: CachedCard[];
}

function InfiniteCardGrid({ cards }: InfiniteCardGridProps) {
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { cards: allCards } = useCardData();
  const prefersReducedMotion = usePrefersReducedMotion();
  
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
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
        {visibleCards.map((card, index) => {
          const backCard = card.backCardId ? cardIdMap.get(card.backCardId) : undefined;
          return (
            <motion.div
              key={card._id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: prefersReducedMotion ? 0 : Math.min(index * 0.02, 0.5) 
              }}
            >
              <CardGridItem
                card={card}
                backCard={backCard}
              />
            </motion.div>
          );
        })}
      </div>

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Loading more cards
            </span>
          </div>
        </div>
      )}

      {visibleCards.length === 0 && (
        <motion.div 
          initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-xl border border-primary/30 flex items-center justify-center bg-primary/5 shadow-[0_0_30px_-5px_var(--primary)]">
              <LayoutGrid className="h-10 w-10 text-primary/50" />
            </div>
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-xl -z-10" />
          </div>
          <h3 className="text-xl font-display font-bold uppercase tracking-widest mb-2">No Cards Found</h3>
          <p className="text-muted-foreground font-mono text-sm tracking-wide max-w-md">
            Try adjusting your search query or filters to find what you're looking for
          </p>
        </motion.div>
      )}
    </>
  );
}

function ActiveDeckSidebar() {
  const { activeDeck, isLoading } = useActiveDeck();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (isLoading) {
    return (
      <div className="p-4 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Loading deck</span>
      </div>
    );
  }

  if (!activeDeck) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hexagon className="h-5 w-5 text-primary/30" />
          <span className="text-sm font-mono uppercase tracking-wider">No Active Deck</span>
        </div>
        <p className="text-xs text-muted-foreground/60 font-mono">
          Select a deck to start adding cards
        </p>
      </div>
    );
  }

  const totalCards = Object.values(activeDeck.mainQuantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <motion.div 
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Active Deck</span>
        </div>
        <h3 className="text-lg font-display font-bold uppercase tracking-wider">{activeDeck.name}</h3>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-mono font-bold text-primary">{totalCards}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cards</span>
          </div>
          
          {activeDeck.format && (
            <Badge variant="outline" className="text-xs">
              {activeDeck.format}
            </Badge>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function GalleryView() {
  const { state, meta } = useGalleryFilters();
  const prefersReducedMotion = usePrefersReducedMotion();
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
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-xl border border-primary/30 flex items-center justify-center bg-primary/5">
            <Database className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-xl animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-display font-semibold uppercase tracking-widest">Initializing Database</p>
          <p className="text-sm font-mono text-muted-foreground tracking-wide">Loading card data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4">
          <GalleryStats 
            totalCards={meta.totalCards} 
            filteredCount={meta.filteredCount} 
            isLoading={meta.isLoadingMore}
          />
          
          <InfiniteCardGrid key={filterKey} cards={meta.filteredCards} />
        </div>
      </div>

      <LoadingProgress progress={meta.loadProgress} isLoadingMore={meta.isLoadingMore} />
    </div>
  );
}

export { GalleryView as UniversusGalleryView };
