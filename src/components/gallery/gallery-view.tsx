"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Database, Cloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IMAGE_BASE_URL } from "@/config/universus";
import { useCardData, filterCards, sortCards, CachedCard } from "@/lib/universus";
import { useUIState } from "@/providers/UIStateProvider";

const CARDS_PER_PAGE = 50;

interface CardGridItemProps {
  card: CachedCard;
}

function CardGridItem({ card }: CardGridItemProps) {
  return (
    <Card className="overflow-hidden group cursor-pointer hover:ring-2 ring-primary transition-all">
      <div className="aspect-[2.5/3.5] relative bg-muted">
        {card.imageUrl ? (
          <img
            src={card.imageUrl.startsWith("http") ? card.imageUrl : `${IMAGE_BASE_URL}/${card.imageUrl}`}
            alt={card.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No Image</span>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate" title={card.name}>
          {card.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {card.type}
          </Badge>
          {card.rarity && (
            <span className="text-xs text-muted-foreground">{card.rarity}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingProgress({ progress, isLoadingMore }: { progress: number; isLoadingMore: boolean }) {
  if (!isLoadingMore || progress >= 100) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-3 flex items-center gap-3 z-50">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Loading cards...</span>
        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-medium">{progress}%</span>
    </div>
  );
}

function CacheStatusBadge({ 
  cachedVersion, 
  serverVersion, 
  isSyncing,
  cardCount,
  onRefresh 
}: { 
  cachedVersion: number | null;
  serverVersion: number | null;
  isSyncing: boolean;
  cardCount: number;
  onRefresh: () => void;
}) {
  const isUpToDate = cachedVersion !== null && cachedVersion === serverVersion;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          onClick={onRefresh}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isUpToDate ? (
            <Database className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Cloud className="h-3.5 w-3.5 text-yellow-500" />
          )}
          <span className="text-xs">
            {cardCount.toLocaleString()} cached
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p>Cache Version: {cachedVersion ?? "None"}</p>
          <p>Server Version: {serverVersion ?? "Loading..."}</p>
          <p>{isSyncing ? "Syncing..." : isUpToDate ? "Up to date" : "Update available"}</p>
          <p className="mt-1 text-muted-foreground">Click to refresh</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function GalleryView() {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { uiState } = useUIState();
  const {
    cards,
    isLoading,
    isLoadingMore,
    loadProgress,
    cachedVersion,
    serverVersion,
    isSyncing,
    refreshCache,
    uniqueValues,
  } = useCardData();

  const filters = useMemo(() => ({
    search,
    searchMode: "name" as const,
    ...uiState.galleryFilters,
  }), [search, uiState.galleryFilters]);

  const sortOptions = useMemo(() => ({
    field: uiState.gallerySortField ?? "name",
    direction: uiState.gallerySortDirection ?? "asc" as const,
  }), [uiState.gallerySortField, uiState.gallerySortDirection]);

  const filteredCards = useMemo(() => {
    const filtered = filterCards(cards, filters);
    return sortCards(filtered, sortOptions);
  }, [cards, filters, sortOptions]);

  const visibleCards = useMemo(() => {
    return filteredCards.slice(0, visibleCount);
  }, [filteredCards, visibleCount]);

  const handleLoadMore = useCallback(() => {
    if (visibleCount < filteredCards.length) {
      setVisibleCount((prev) => Math.min(prev + CARDS_PER_PAGE, filteredCards.length));
    }
  }, [visibleCount, filteredCards.length]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  useEffect(() => {
    setVisibleCount(CARDS_PER_PAGE);
  }, [search, filters]);

  if (isLoading && cards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading card data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Card Gallery</h1>
            <p className="text-muted-foreground">
              {filteredCards.length.toLocaleString()} cards
              {filteredCards.length !== cards.length && (
                <span className="text-muted-foreground/60">
                  {" "}of {cards.length.toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <CacheStatusBadge
            cachedVersion={cachedVersion}
            serverVersion={serverVersion}
            isSyncing={isSyncing}
            cardCount={cards.length}
            onRefresh={refreshCache}
          />
        </div>
        <Input
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visibleCards.map((card) => (
          <CardGridItem key={card._id} card={card} />
        ))}
      </div>

      {visibleCount < filteredCards.length && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {visibleCards.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">No cards found</p>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      <LoadingProgress progress={loadProgress} isLoadingMore={isLoadingMore} />
    </div>
  );
}

export { GalleryView as UniversusGalleryView };
