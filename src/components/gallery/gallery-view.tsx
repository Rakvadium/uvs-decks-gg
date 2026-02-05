"use client";

import { useState, useMemo, useRef, useEffect, useCallback, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Loader2, UserIcon, Hexagon, Database, LayoutGrid, Layers, BookOpen, Bookmark, ChevronRight, Minus, Plus, MoreVertical, RotateCcw, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useCardData, CachedCard } from "@/lib/universus";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { CardDetailsContent, CardDetailsDialog, CardGridItem } from "@/components/universus";
import { GalleryTopBarFilters } from "./gallery-header";
import { DecksSidebar } from "./decks-sidebar";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SymbolBadge, SymbolIcon } from "@/components/universus/symbol-icon";
import { formatUniversusCardType } from "@/config/universus";
import { cn } from "@/lib/utils";
import { SidebarFooter } from "@/components/shell";
import { useTcgDraggable, useTcgDroppable } from "@/lib/dnd";
import { canAddCardToSection, canMoveCardToSection, useDeckEditor, type DeckSectionCounts } from "@/lib/deck";

const CARDS_PER_PAGE = 50;
const CARD_TYPE_ORDER = ["Attack", "Foundation", "Action", "Asset", "Backup", "Character"] as const;
const CARD_TYPE_LABELS: Record<string, string> = {
  Attack: "Attack",
  Foundation: "Foundation",
  Action: "Action",
  Asset: "Asset",
  Backup: "Backups",
  Character: "Characters",
};
const SECTION_META = {
  main: { label: "Main", icon: Layers },
  side: { label: "Side", icon: BookOpen },
  reference: { label: "Reference", icon: Bookmark },
} as const;
const SECTION_KEYS = ["main", "side", "reference"] as const;

function ActiveDeckIcon({ className }: { className?: string }) {
  const { activeDeck } = useActiveDeck();
  const { cards } = useCardData();

  const startingCharacter = useMemo(() => {
    if (!activeDeck?.startingCharacterId) return null;
    return cards.find((card) => card._id === activeDeck.startingCharacterId) ?? null;
  }, [activeDeck?.startingCharacterId, cards]);

  if (!startingCharacter?.imageUrl) {
    return <UserIcon className={className} />;
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image src={startingCharacter.imageUrl} alt={startingCharacter.name} fill className="object-cover object-top" />
    </div>
  );
}

function ActiveDeckHeader() {
  const { activeDeck, isLoading } = useActiveDeck();

  if (isLoading) {
    return (
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Loading deck</span>
    );
  }

  const label = activeDeck?.name ?? "Active Deck";

  return (
    <h3
      className="truncate font-display text-sm font-bold uppercase tracking-[0.2em] text-primary drop-shadow-[0_0_8px_var(--primary)]"
      title={label}
    >
      {label}
    </h3>
  );
}

function ActiveDeckFooter() {
  const { activeDeck } = useActiveDeck();
  if (!activeDeck) return null;

  return (
    <SidebarFooter
      primaryAction={{
        label: "Open Deck Details",
        href: `/decks/${activeDeck._id}`,
        icon: ChevronRight,
        iconPosition: "right",
      }}
    />
  );
}

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
  cardsPerRow: number;
}

function InfiniteCardGrid({ cards, cardsPerRow }: InfiniteCardGridProps) {
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { cards: allCards } = useCardData();
  const prefersReducedMotion = usePrefersReducedMotion();
  const clampedCardsPerRow = Math.min(10, Math.max(3, Math.round(cardsPerRow)));
  const gridStyle = useMemo(
    () => ({ "--cards-per-row": clampedCardsPerRow }) as CSSProperties,
    [clampedCardsPerRow]
  );
  
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
      <div
        className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(var(--cards-per-row),minmax(0,1fr))]"
        style={gridStyle}
      >
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

function CardListItem({ card, backCard }: { card: CachedCard; backCard?: CachedCard | null }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    hasDeck,
    getCardCount,
    addCard,
    removeCard,
    mainCounts,
    sideCounts,
    referenceCounts,
  } = useDeckEditor();
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: "gallery-list",
  });
  const dragBlockRef = useRef(false);
  const deckCount = getCardCount(card._id);
  const sectionCounts = useMemo(
    () => ({ mainCounts, sideCounts, referenceCounts }),
    [mainCounts, sideCounts, referenceCounts]
  );
  const canAddToDeck = canAddCardToSection({
    card,
    cardId: card._id,
    section: "main",
    counts: sectionCounts,
  });

  useEffect(() => {
    if (isDragging) {
      dragBlockRef.current = true;
      return;
    }
    if (dragBlockRef.current) {
      const timeout = window.setTimeout(() => {
        dragBlockRef.current = false;
      }, 120);
      return () => window.clearTimeout(timeout);
    }
  }, [isDragging]);

  const handleOpen = useCallback(() => {
    if (dragBlockRef.current) return;
    setIsDialogOpen(true);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  }, [handleOpen]);

  return (
    <>
      <div
        className={cn(
          "group flex w-full items-center gap-4 rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-foreground",
          "min-h-[84px] shadow-[0_0_20px_-18px_var(--primary)]",
          "transition-colors hover:border-primary/40 hover:bg-card/70",
          "[contain:layout_paint]",
          isDragging && "opacity-60"
        )}
        style={{
          ...dragHandleProps.style,
          cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
        }}
        onMouseDown={dragHandleProps.onMouseDown}
        onTouchStart={dragHandleProps.onTouchStart}
        onDragStart={(event) => event.preventDefault()}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="relative h-16 w-12 overflow-hidden rounded-lg border border-border/40 bg-muted/40 shrink-0">
          {card.imageUrl ? (
            <Image src={card.imageUrl} alt={card.name} fill className="object-cover object-top" draggable={false} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Hexagon className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-semibold truncate">{card.name}</p>
            {card.collectorNumber && (
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                #{card.collectorNumber}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
            {card.type && (
              <Badge variant="cyber" className="backdrop-blur-none bg-card/40 border-primary/40">
                {card.type}
              </Badge>
            )}
            {card.setName && <span className="truncate">{card.setName}</span>}
            {card.rarity && <span>{card.rarity}</span>}
          </div>
        </div>
        {hasDeck && (
          <div className="flex items-center gap-1" data-no-drag>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
                removeCard(card._id);
              }}
              disabled={deckCount === 0}
              className="border-destructive/30 hover:border-destructive hover:bg-destructive/10"
            >
              <Minus className="h-3.5 w-3.5 text-destructive" />
            </Button>
            <span className="w-8 text-center font-mono font-bold text-primary text-xs">
              {deckCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
                addCard(card._id);
              }}
              disabled={!canAddToDeck}
              className="border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
            </Button>
          </div>
        )}
      </div>

      <CardDetailsDialog
        card={card}
        backCard={backCard}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}

function CardDetailsListItem({ card, backCard }: { card: CachedCard; backCard?: CachedCard | null }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    hasDeck,
    getCardCount,
    addCard,
    removeCard,
    mainCounts,
    sideCounts,
    referenceCounts,
  } = useDeckEditor();
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: "gallery-details",
  });
  const deckCount = getCardCount(card._id);
  const sectionCounts = useMemo(
    () => ({ mainCounts, sideCounts, referenceCounts }),
    [mainCounts, sideCounts, referenceCounts]
  );
  const canAddToDeck = canAddCardToSection({
    card,
    cardId: card._id,
    section: "main",
    counts: sectionCounts,
  });
  const hasBack = !!backCard;
  const displayCard = isFlipped && backCard ? backCard : card;

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border/40 bg-card/30 p-4 md:p-6 transition-all",
          isDragging && "opacity-70"
        )}
      >
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <div className="relative w-full max-w-[260px] mx-auto lg:mx-0">
              <div
                className={cn(
                  "relative aspect-[2.5/3.5] w-full overflow-hidden rounded-xl border border-border/50 bg-muted/40",
                  "shadow-[0_0_24px_-8px_var(--primary)/40]"
                )}
                style={{
                  ...dragHandleProps.style,
                  cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
                }}
                onMouseDown={dragHandleProps.onMouseDown}
                onTouchStart={dragHandleProps.onTouchStart}
                onDragStart={(event) => event.preventDefault()}
              >
                {displayCard.imageUrl ? (
                  <Image
                    src={displayCard.imageUrl}
                    alt={displayCard.name}
                    fill
                    className="object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/50 border border-border/50">
                    <div className="text-center">
                      <Hexagon className="h-10 w-10 mx-auto mb-2 text-primary/30" />
                      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">No Image</span>
                    </div>
                  </div>
                )}
              </div>
              {!prefersReducedMotion && (
                <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-2xl -z-10" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
              {hasBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="gap-2"
                >
                  <RotateCcw className={cn(
                    "h-4 w-4",
                    !prefersReducedMotion && "transition-transform duration-300",
                    isFlipped && "rotate-180"
                  )} />
                  <span className="font-mono uppercase tracking-wider text-xs">
                    {isFlipped ? "Front" : "Back"}
                  </span>
                </Button>
              )}

              {hasDeck && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => removeCard(card._id)}
                    disabled={deckCount === 0}
                    className="border-destructive/30 hover:border-destructive hover:bg-destructive/10"
                  >
                    <Minus className="h-4 w-4 text-destructive" />
                  </Button>
                  <span className="w-8 text-center font-mono font-bold text-primary">
                    {deckCount}
                  </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => addCard(card._id)}
                  disabled={!canAddToDeck}
                  className="border-primary/30 hover:border-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 text-primary" />
                </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="font-mono uppercase tracking-wider text-xs">Open Dialog</span>
              </Button>
            </div>
          </div>

          <CardDetailsContent card={displayCard} className="overflow-visible p-0" />
        </div>
      </div>

      <CardDetailsDialog
        card={card}
        backCard={backCard}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}

interface InfiniteCardListProps {
  cards: CachedCard[];
  className?: string;
  renderCard: (card: CachedCard, index: number, backCard?: CachedCard | null) => React.ReactNode;
}

function InfiniteCardList({ cards, className, renderCard }: InfiniteCardListProps) {
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
      <div className={cn("space-y-3", className)}>
        {visibleCards.map((card, index) => {
          const backCard = card.backCardId ? cardIdMap.get(card.backCardId) : undefined;
          return (
            <div key={card._id} className="w-full">
              {renderCard(card, index, backCard)}
            </div>
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

type DeckSection = "main" | "side" | "reference";

interface SectionGroup {
  type: string;
  label: string;
  total: number;
  cards: { card: CachedCard; count: number }[];
}

function buildSectionGroups(
  quantities: Record<string, number>,
  cardMap: Map<string, CachedCard>
): SectionGroup[] {
  const groups = new Map<string, { card: CachedCard; count: number }[]>();

  for (const [cardId, count] of Object.entries(quantities)) {
    if (count <= 0) continue;
    const card = cardMap.get(cardId);
    if (!card) continue;
    const normalizedType = formatUniversusCardType(card.type) ?? card.type ?? "Other";
    const list = groups.get(normalizedType) ?? [];
    list.push({ card, count });
    groups.set(normalizedType, list);
  }

  for (const [, list] of groups) {
    list.sort((a, b) => {
      const aDifficulty = typeof a.card.difficulty === "number" ? a.card.difficulty : Number.POSITIVE_INFINITY;
      const bDifficulty = typeof b.card.difficulty === "number" ? b.card.difficulty : Number.POSITIVE_INFINITY;
      if (aDifficulty !== bDifficulty) return aDifficulty - bDifficulty;
      return a.card.name.localeCompare(b.card.name);
    });
  }

  const orderedTypes = [
    ...CARD_TYPE_ORDER,
    ...Array.from(groups.keys()).filter((type) => !CARD_TYPE_ORDER.includes(type as (typeof CARD_TYPE_ORDER)[number])).sort(),
  ];

  return orderedTypes
    .filter((type) => groups.has(type))
    .map((type) => {
      const cards = groups.get(type) ?? [];
      const total = cards.reduce((sum, entry) => sum + entry.count, 0);
      return {
        type,
        label: CARD_TYPE_LABELS[type] ?? type,
        total,
        cards,
      };
    });
}

interface ActiveDeckSectionProps {
  sectionKey: DeckSection;
  groups: SectionGroup[];
  sectionCount: number;
  addCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  removeCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  moveCard: (cardId: CachedCard["_id"], from: DeckSection, to: DeckSection) => void;
  sectionCounts: DeckSectionCounts;
  setHoveredCard: (card: CachedCard | null) => void;
  setHoveredRect: (rect: DOMRect | null) => void;
  isDroppableDisabled: boolean;
}

interface ActiveDeckCardRowProps {
  card: CachedCard;
  count: number;
  sectionKey: DeckSection;
  addCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  removeCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  moveCard: (cardId: CachedCard["_id"], from: DeckSection, to: DeckSection) => void;
  sectionCounts: DeckSectionCounts;
  setHoveredCard: (card: CachedCard | null) => void;
  setHoveredRect: (rect: DOMRect | null) => void;
}

function ActiveDeckCardRow({
  card,
  count,
  sectionKey,
  addCard,
  removeCard,
  moveCard,
  sectionCounts,
  setHoveredCard,
  setHoveredRect,
}: ActiveDeckCardRowProps) {
  const canAddToDeck = canAddCardToSection({
    card,
    cardId: card._id,
    section: sectionKey,
    counts: sectionCounts,
  });
  const moveTargets = SECTION_KEYS.filter((key) => key !== sectionKey);
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: `active-deck:${sectionKey}`,
  });

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition",
        "hover:border-primary/20 hover:bg-primary/5",
        isDragging && "opacity-60"
      )}
      style={{
        ...dragHandleProps.style,
        cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
      }}
      data-slot="deck-card-row"
      onMouseDown={dragHandleProps.onMouseDown}
      onTouchStart={dragHandleProps.onTouchStart}
      onDragStart={(event) => event.preventDefault()}
      onMouseEnter={(event) => {
        setHoveredCard(card);
        setHoveredRect(event.currentTarget.getBoundingClientRect());
      }}
      onMouseMove={(event) => {
        setHoveredRect(event.currentTarget.getBoundingClientRect());
      }}
      onMouseLeave={() => {
        setHoveredCard(null);
        setHoveredRect(null);
      }}
    >
      <div className="relative h-8 w-6 overflow-hidden rounded border border-border/40 bg-muted/40">
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt={card.name} fill className="object-cover object-top" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Hexagon className="h-3 w-3 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 transition-all duration-200 group-hover:pr-24">
        <p className="text-xs font-medium truncate">{card.name}</p>
      </div>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-opacity duration-150 group-hover:opacity-0">
        x{count}
      </span>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          onClick={() => removeCard(card._id, sectionKey)}
          disabled={count <= 0}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[26px] text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          x{count}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          onClick={() => addCard(card._id, sectionKey)}
          disabled={!canAddToDeck}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7" data-no-drag>
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move To</DropdownMenuLabel>
            {moveTargets.map((target) => (
              <DropdownMenuItem
                key={`${card._id}-move-${target}`}
                onClick={() => moveCard(card._id, sectionKey, target)}
                disabled={
                  count <= 0
                  || !canMoveCardToSection({
                    card,
                    cardId: card._id,
                    fromSection: sectionKey,
                    toSection: target,
                    counts: sectionCounts,
                  })
                }
              >
                Move To {SECTION_META[target].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => removeCard(card._id, sectionKey)}
              disabled={count <= 0}
              variant="destructive"
            >
              Remove One
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ActiveDeckSection({
  sectionKey,
  groups,
  sectionCount,
  addCard,
  removeCard,
  moveCard,
  sectionCounts,
  setHoveredCard,
  setHoveredRect,
  isDroppableDisabled,
}: ActiveDeckSectionProps) {
  const sectionMeta = SECTION_META[sectionKey];
  const Icon = sectionMeta.icon;

  const handleDrop = useCallback((item: { card: CachedCard; sourceId?: string }) => {
    const sourceId = item.sourceId ?? "";
    const sourceSection = sourceId.startsWith("active-deck:") ? (sourceId.split(":")[1] as DeckSection) : null;
    if (sourceSection) {
      if (sourceSection === sectionKey) return;
      if (!canMoveCardToSection({
        card: item.card,
        cardId: item.card._id,
        fromSection: sourceSection,
        toSection: sectionKey,
        counts: sectionCounts,
      })) return;
      moveCard(item.card._id, sourceSection, sectionKey);
      return;
    }

    if (!canAddCardToSection({
      card: item.card,
      cardId: item.card._id,
      section: sectionKey,
      counts: sectionCounts,
    })) return;

    addCard(item.card._id, sectionKey);
  }, [addCard, moveCard, sectionCounts, sectionKey]);

  const { isOver, canDrop, droppableProps } = useTcgDroppable({
    id: `active-deck-section-${sectionKey}`,
    accepts: ["card"],
    onDrop: handleDrop,
    isDisabled: isDroppableDisabled,
  });

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-card/40 p-3 space-y-2 transition-colors",
        canDrop && "border-primary/40 bg-primary/5",
        isOver && "bg-primary/10"
      )}
      {...droppableProps}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {sectionMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canDrop && (
            <Badge variant="outline" className="text-[9px] border-primary/60 text-primary">
              {isOver ? "Release" : "Drop"}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="text-sm font-mono font-bold text-primary border-primary/50 bg-primary/15 px-2.5 py-0.5"
          >
            {sectionCount}
          </Badge>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/50 px-3 py-2 text-[11px] text-muted-foreground">
          No cards in this section yet.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.type} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {group.total}
                </span>
              </div>
              <div className="space-y-1">
                {group.cards.map(({ card, count }) => (
                  <ActiveDeckCardRow
                    key={card._id}
                    card={card}
                    count={count}
                    sectionKey={sectionKey}
                    addCard={addCard}
                    removeCard={removeCard}
                    moveCard={moveCard}
                    sectionCounts={sectionCounts}
                    setHoveredCard={setHoveredCard}
                    setHoveredRect={setHoveredRect}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveDeckSidebar() {
  const {
    activeDeck,
    isLoading,
    updateDeck,
    addCard,
    removeCard,
    moveCard,
    getTotalCardCount,
    getSectionCardCount,
  } = useActiveDeck();
  const { cards: allCards } = useCardData();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [characterQuery, setCharacterQuery] = useState("");
  const [characterOpen, setCharacterOpen] = useState(false);
  const [characterDetailsOpen, setCharacterDetailsOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<CachedCard | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  const cardMap = useMemo(() => {
    const map = new Map<string, CachedCard>();
    for (const card of allCards) {
      map.set(card._id, card);
    }
    return map;
  }, [allCards]);

  const startingCharacter = useMemo(() => {
    if (!activeDeck?.startingCharacterId) return null;
    return cardMap.get(activeDeck.startingCharacterId) ?? null;
  }, [activeDeck?.startingCharacterId, cardMap]);

  const startingCharacterBack = useMemo(() => {
    if (!startingCharacter?.backCardId) return null;
    return cardMap.get(startingCharacter.backCardId) ?? null;
  }, [startingCharacter?.backCardId, cardMap]);

  const selectedSymbol = useMemo(() => {
    if (!activeDeck?.selectedIdentity) return null;
    return activeDeck.selectedIdentity.toLowerCase();
  }, [activeDeck?.selectedIdentity]);

  const characterSymbols = useMemo(() => {
    if (!startingCharacter?.symbols) return [];
    const rawSymbols = startingCharacter.symbols
      .split(/[,|]/)
      .map((symbol) => symbol.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set(rawSymbols)];
  }, [startingCharacter?.symbols]);

  const characterOptions = useMemo(() => {
    return allCards
      .filter((card) => formatUniversusCardType(card.type) === "Character")
      .filter((card) => card.isFrontFace !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCards]);

  const filteredCharacters = useMemo(() => {
    if (!characterQuery.trim()) return characterOptions;
    const query = characterQuery.toLowerCase();
    return characterOptions.filter((card) => card.name.toLowerCase().includes(query));
  }, [characterOptions, characterQuery]);

  const sectionGroups = useMemo(() => {
    if (!activeDeck) return null;
    return {
      main: buildSectionGroups(activeDeck.mainQuantities, cardMap),
      side: buildSectionGroups(activeDeck.sideQuantities, cardMap),
      reference: buildSectionGroups(activeDeck.referenceQuantities, cardMap),
    };
  }, [activeDeck, cardMap]);

  const sectionCounts = useMemo<DeckSectionCounts>(() => ({
    mainCounts: activeDeck?.mainQuantities ?? {},
    sideCounts: activeDeck?.sideQuantities ?? {},
    referenceCounts: activeDeck?.referenceQuantities ?? {},
  }), [activeDeck?.mainQuantities, activeDeck?.sideQuantities, activeDeck?.referenceQuantities]);

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

  const totalCards = getTotalCardCount();
  const hoverPreview = useMemo(() => {
    if (!hoveredCard || !hoveredRect) return null;
    if (typeof document === "undefined") return null;

    const previewWidth = 220;
    const previewHeight = Math.round(previewWidth * 1.4);
    const gap = 16;
    const left = Math.max(12, hoveredRect.left - previewWidth - gap);
    const top = Math.min(
      window.innerHeight - previewHeight - 12,
      Math.max(12, hoveredRect.top + hoveredRect.height / 2 - previewHeight / 2)
    );

    return createPortal(
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.96 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
        className="pointer-events-none fixed z-[60]"
        style={{ left, top, width: previewWidth, height: previewHeight }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-xl border border-primary/30 bg-background/80 shadow-[0_0_30px_-10px_var(--primary)]">
          {hoveredCard.imageUrl ? (
            <Image
              src={hoveredCard.imageUrl}
              alt={hoveredCard.name}
              fill
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {hoveredCard.name}
            </div>
          )}
        </div>
      </motion.div>,
      document.body
    );
  }, [hoveredCard, hoveredRect, prefersReducedMotion]);

  return (
    <div className="relative h-full overflow-y-auto p-4 space-y-3">
      {hoverPreview}
      <div className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="relative">
              <Popover open={characterOpen} onOpenChange={setCharacterOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose starting character"
                    className={cn(
                      "relative h-20 w-16 overflow-hidden rounded-md border border-border/40 bg-muted/40",
                      "transition-all hover:border-primary/40 hover:shadow-[0_0_12px_-6px_var(--primary)]",
                      !startingCharacter && "opacity-80"
                    )}
                  >
                    {startingCharacter?.imageUrl ? (
                      <Image src={startingCharacter.imageUrl} alt={startingCharacter.name} fill className="object-cover object-top" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Hexagon className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" align="start">
                  <div className="space-y-3">
                    {startingCharacter && (
                      <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-card/40 px-2.5 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative h-9 w-7 overflow-hidden rounded border border-border/40 bg-muted/40">
                            {startingCharacter.imageUrl ? (
                              <Image
                                src={startingCharacter.imageUrl}
                                alt={startingCharacter.name}
                                fill
                                className="object-cover object-top"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Hexagon className="h-3 w-3 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{startingCharacter.name}</p>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                              {activeDeck.description?.trim() ? activeDeck.description : "No description yet."}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-mono uppercase tracking-wider"
                          onClick={() => {
                            setCharacterOpen(false);
                            setCharacterDetailsOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                    <Input
                      placeholder="Search characters..."
                      value={characterQuery}
                      onChange={(event) => setCharacterQuery(event.target.value)}
                      className="h-8"
                    />
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredCharacters.map((card) => (
                        <button
                          key={card._id}
                          type="button"
                          onClick={() => {
                            updateDeck({ startingCharacterId: card._id });
                            setCharacterOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left hover:border-primary/40 hover:bg-primary/5",
                            card._id === activeDeck.startingCharacterId && "border-primary/40 bg-primary/10"
                          )}
                        >
                          <div className="relative h-8 w-6 overflow-hidden rounded border border-border/40 bg-muted/40">
                            {card.imageUrl ? (
                              <Image src={card.imageUrl} alt={card.name} fill className="object-cover object-top" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Hexagon className="h-3 w-3 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{card.name}</p>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                              {card.setName ?? card.setCode ?? "Character"}
                            </p>
                          </div>
                        </button>
                      ))}
                      {filteredCharacters.length === 0 && (
                        <div className="rounded-md border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
                          No characters found.
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {startingCharacter && characterSymbols.length > 0 && (
                <Popover open={symbolOpen} onOpenChange={setSymbolOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Change symbol"
                      className={cn(
                        "absolute -bottom-1 -right-1 z-10 flex h-9 w-9 items-center justify-center rounded-md border border-border/50 bg-background/80",
                        "transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_12px_-6px_var(--primary)]"
                      )}
                    >
                      <SymbolIcon symbol={selectedSymbol ?? characterSymbols[0]} size="lg" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="end">
                    <div className="flex items-center gap-2">
                      {characterSymbols.map((symbol) => (
                        <SymbolBadge
                          key={symbol}
                          symbol={symbol}
                          selected={selectedSymbol === symbol}
                          onClick={() => {
                            updateDeck({ selectedIdentity: symbol });
                            setSymbolOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-medium truncate flex-1">
                  {startingCharacter?.name ?? "Select a starting character"}
                </p>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground line-clamp-2">
                {activeDeck.description?.trim() ? activeDeck.description : "No description yet."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CardDetailsDialog
        card={startingCharacter}
        backCard={startingCharacterBack}
        open={characterDetailsOpen}
        onOpenChange={setCharacterDetailsOpen}
      />

      <div className="space-y-3">
        {SECTION_KEYS.map((sectionKey) => (
          <ActiveDeckSection
            key={sectionKey}
            sectionKey={sectionKey}
            groups={sectionGroups?.[sectionKey] ?? []}
            sectionCount={getSectionCardCount(sectionKey)}
            addCard={addCard}
            removeCard={removeCard}
            moveCard={moveCard}
            sectionCounts={sectionCounts}
            setHoveredCard={setHoveredCard}
            setHoveredRect={setHoveredRect}
            isDroppableDisabled={!activeDeck}
          />
        ))}
      </div>

    </div>
  );
}

export function GalleryView() {
  const { state, meta } = useGalleryFilters();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { activeDeck } = useActiveDeck();
  const activeDeckLabel = activeDeck?.name ?? "Active Deck";
  const activeDeckSlotOptions = useMemo(
    () => ({
      label: activeDeckLabel,
      icon: ActiveDeckIcon,
      header: ActiveDeckHeader,
      footer: ActiveDeckFooter,
    }),
    [activeDeckLabel]
  );
  const decksSlotOptions = useMemo(
    () => ({
      label: "Decks",
      icon: Layers,
      priority: 1,
    }),
    []
  );

  useRegisterSlot("top-bar", "gallery-filters", GalleryTopBarFilters);
  useRegisterSlot("right-sidebar", "active-deck", ActiveDeckSidebar, activeDeckSlotOptions);
  useRegisterSlot("right-sidebar", "decks", DecksSidebar, decksSlotOptions);

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
        <div className="p-4 md:p-6 space-y-4 pb-[8rem] md:pb-4">
          <GalleryStats 
            totalCards={meta.totalCards} 
            filteredCount={meta.filteredCount} 
            isLoading={meta.isLoadingMore}
          />

          {state.viewMode === "card" ? (
            <InfiniteCardGrid key={filterKey} cards={meta.filteredCards} cardsPerRow={state.cardsPerRow} />
          ) : state.viewMode === "list" ? (
            <InfiniteCardList
              key={filterKey}
              cards={meta.filteredCards}
              className="space-y-3"
              renderCard={(card, _index, backCard) => (
                <CardListItem card={card} backCard={backCard} />
              )}
            />
          ) : (
            <InfiniteCardList
              key={filterKey}
              cards={meta.filteredCards}
              className="space-y-6"
              renderCard={(card, _index, backCard) => (
                <CardDetailsListItem card={card} backCard={backCard} />
              )}
            />
          )}
        </div>
      </div>

      <LoadingProgress progress={meta.loadProgress} isLoadingMore={meta.isLoadingMore} />
    </div>
  );
}

export { GalleryView as UniversusGalleryView };
