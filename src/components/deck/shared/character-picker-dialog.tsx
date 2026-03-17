"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import Image from "next/image";
import { Loader2, Search } from "lucide-react";
import { UNIVERSUS_FILTER_SYMBOLS, UNIVERSUS_SYMBOL_DISPLAY, formatUniversusCardType, type UniversusSymbol } from "@/config/universus";
import { useCardData, filterCards } from "@/lib/universus";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useInfiniteSlice } from "@/hooks/useInfiniteSlice";
import { Button } from "@/components/ui/button";
import { CardGridItem } from "@/components/universus/card-grid-item";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DeckCharacterPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCharacterId?: Id<"cards"> | null;
  onSelectCharacter: (cardId: Id<"cards">) => void | Promise<void>;
}

function CharacterPickerSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
      {Array.from({ length: 24 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="aspect-[2.5/3.5] w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function DeckCharacterPickerDialog({
  open,
  onOpenChange,
  selectedCharacterId,
  onSelectCharacter,
}: DeckCharacterPickerDialogProps) {
  const { cards, isLoading } = useCardData();
  const cardIdMap = useCardIdMap(cards);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<UniversusSymbol | null>(null);
  const [isSelectingId, setIsSelectingId] = useState<Id<"cards"> | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const characterCards = useMemo(() => {
    const characterOnly = cards.filter(
      (card) => formatUniversusCardType(card.type) === "Character" && card.isFrontFace !== false && card.isVariant !== true
    );
    const filtered = filterCards(characterOnly, {
      search: debouncedSearch || undefined,
      searchMode: "name",
      symbols: selectedSymbol ? [selectedSymbol] : undefined,
    });
    return filtered.sort((a, b) => {
      const setNumA = a.setNumber ?? 0;
      const setNumB = b.setNumber ?? 0;
      if (setNumB !== setNumA) return setNumB - setNumA;
      return (a.number ?? 0) - (b.number ?? 0);
    });
  }, [cards, debouncedSearch, selectedSymbol]);

  const {
    visibleItems: visibleCharacters,
    hasMore,
    loadMoreRef,
  } = useInfiniteSlice({
    items: characterCards,
    pageSize: 20,
    resetKey: `${debouncedSearch}-${selectedSymbol ?? "any"}`,
  });

  const getBackCard = useCallback(
    (card: (typeof characterCards)[0]) =>
      card.backCardId ? (cardIdMap.get(card.backCardId) ?? null) : null,
    [cardIdMap]
  );

  const handleSelectCharacter = useCallback(
    async (cardId: Id<"cards">) => {
      setIsSelectingId(cardId);

      try {
        await onSelectCharacter(cardId);
        onOpenChange(false);
      } finally {
        setIsSelectingId(null);
      }
    },
    [onOpenChange, onSelectCharacter]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="sticky top-0 z-50 shrink-0 flex flex-col gap-4 border-b border-border/50 bg-card px-6 py-4">
          <DialogTitle className="text-xl">Change Starting Character</DialogTitle>
          <div className="flex min-w-0 items-center justify-between">

            <div className="relative w-[25rem] shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search characters..."
                className="pl-9"
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-lg border border-border/50 bg-card/30 p-2 backdrop-blur-sm">
              {UNIVERSUS_FILTER_SYMBOLS.map((symbol) => {
                const isSelected = selectedSymbol === symbol;
                const path = getSymbolPath(symbol);

                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setSelectedSymbol((current) => (current === symbol ? null : symbol))}
                    aria-pressed={isSelected}
                    title={UNIVERSUS_SYMBOL_DISPLAY[symbol]}
                    className={cn(
                      "relative h-7 w-7 overflow-hidden rounded-full border border-border/60 bg-background p-0 transition-colors hover:bg-muted",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    )}
                  >
                    {path ? (
                      <Image src={path} alt={symbol} width={32} height={32} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs">{symbol}</span>
                    )}
                  </button>
                );
              })}
            </div>
        
          </div>
        </DialogHeader>

        <div className="relative z-0 flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? <CharacterPickerSkeleton /> : null}

          {!isLoading && visibleCharacters.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 px-6 text-center text-sm text-muted-foreground">
              No characters match the current search and symbol filters.
            </div>
          ) : null}

          {!isLoading && visibleCharacters.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-5">
              <CardNavigationProvider cards={visibleCharacters} getBackCard={getBackCard}>
                {visibleCharacters.map((character) => {
                  const isSelected = selectedCharacterId === character._id;
                  const isSelecting = isSelectingId === character._id;

                  return (
                    <div key={character._id} className="relative">
                      <CardGridItem
                        card={character}
                        onCardClick={async () => {
                          await handleSelectCharacter(character._id);
                        }}
                      />
                      {isSelected ? (
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background" />
                      ) : null}
                      {isSelecting ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </CardNavigationProvider>
            </div>
          ) : null}

          <div ref={loadMoreRef} className="flex h-16 items-center justify-center">
            {!isLoading && !hasMore && visibleCharacters.length > 0 ? (
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                End of characters
              </span>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
