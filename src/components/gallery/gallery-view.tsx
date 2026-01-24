"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IMAGE_BASE_URL } from "@/config/universus";

const CARDS_PER_PAGE = 50;

export function GalleryView() {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const cards = useQuery(api.cards.listReleased);

  const filteredCards = useMemo(() => {
    if (!cards) return [];
    if (!search.trim()) return cards;
    
    const searchLower = search.toLowerCase();
    return cards.filter(
      (card) =>
        card.name.toLowerCase().includes(searchLower) ||
        card.type?.toLowerCase().includes(searchLower) ||
        card.setName?.toLowerCase().includes(searchLower)
    );
  }, [cards, search]);

  const visibleCards = filteredCards.slice(0, visibleCount);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredCards.length) {
          setVisibleCount((prev) => Math.min(prev + CARDS_PER_PAGE, filteredCards.length));
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredCards.length]);

  useEffect(() => {
    setVisibleCount(CARDS_PER_PAGE);
  }, [search]);

  if (!cards) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Card Gallery</h1>
          <p className="text-muted-foreground">
            {filteredCards.length.toLocaleString()} cards
          </p>
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
          <Card key={card._id} className="overflow-hidden group cursor-pointer hover:ring-2 ring-primary transition-all">
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
        ))}
      </div>

      {visibleCount < filteredCards.length && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export { GalleryView as UniversusGalleryView };
