"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CachedCard } from "@/lib/universus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DeckSectionControls } from "./deck-section-controls";
const CardDetailsV2 = dynamic(
  () => import("./variants/v2").then((module) => module.CardDetailsV2),
  { ssr: false }
);

interface CardDetailsDialogProps {
  card: CachedCard | null;
  backCard?: CachedCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards?: CachedCard[];
  getBackCard?: (card: CachedCard) => CachedCard | null | undefined;
}

export function CardDetailsDialog({
  card,
  backCard,
  open,
  onOpenChange,
  cards,
  getBackCard,
}: CardDetailsDialogProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync current index when card changes or dialog opens
  useEffect(() => {
    if (!open || !card || !cards?.length) {
      queueMicrotask(() => setCurrentIndex(-1));
      return;
    }
    const idx = cards.findIndex((c) => c._id === card._id);
    queueMicrotask(() => setCurrentIndex(idx));
  }, [open, card, cards]);

  // Reset flip when navigating
  useEffect(() => {
    queueMicrotask(() => setIsFlipped(false));
  }, [currentIndex]);

  const currentCard = cards && currentIndex >= 0 ? cards[currentIndex] : card;
  const currentBackCard =
    cards && currentIndex >= 0 && getBackCard
      ? getBackCard(cards[currentIndex]) ?? undefined
      : backCard;

  const canGoPrev = cards && currentIndex > 0;
  const canGoNext = cards && currentIndex >= 0 && currentIndex < cards.length - 1;
  const hasNavigation = cards && cards.length > 1 && currentIndex >= 0;

  const goToPrev = useCallback(() => {
    if (!canGoPrev) return;
    setCurrentIndex((i) => i - 1);
  }, [canGoPrev]);

  const goToNext = useCallback(() => {
    if (!canGoNext) return;
    setCurrentIndex((i) => i + 1);
  }, [canGoNext]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!hasNavigation || !touchStartRef.current) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Treat only deliberate horizontal swipes as navigation.
      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;

      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    },
    [goToNext, goToPrev, hasNavigation]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open || !hasNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasNavigation, goToPrev, goToNext]);

  if (!currentCard) return null;

  const displayCard = isFlipped && currentBackCard ? currentBackCard : currentCard;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        className="overflow-x-hidden p-0 md:max-h-[90vh] md:overflow-visible md:pb-0 md:w-[60vw] md:min-w-[60vw] md:max-w-[60vw]"
        showCloseButton={false}
        allowOverflow
      >
        <DialogTitle className="sr-only">{displayCard.name} - Card Details</DialogTitle>
        <div
          className="relative flex h-full min-h-0 touch-pan-y flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {hasNavigation && (
            <div
              data-card-details-nav="true"
              className="pointer-events-none absolute inset-y-0 left-0 right-0 z-40 hidden md:block"
            >
              <button
                type="button"
                onClick={goToPrev}
                disabled={!canGoPrev}
                className={cn(
                  "pointer-events-auto absolute left-0 top-1/2 flex h-10 w-10 -translate-x-[70%] -translate-y-1/2 items-center justify-center rounded-full transition-all md:h-12 md:w-12 z-[60]",
                  canGoPrev
                    ? "bg-card/90 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_15px_-3px_var(--primary)]"
                    : "bg-card/50 text-muted-foreground/30 border border-border/20 cursor-not-allowed"
                )}
                aria-label="Previous card"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                disabled={!canGoNext}
                className={cn(
                  "pointer-events-auto absolute right-0 top-1/2 flex h-10 w-10 translate-x-[70%] -translate-y-1/2 items-center justify-center rounded-full transition-all md:h-12 md:w-12 z-[60]",
                  canGoNext
                    ? "bg-card/90 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_15px_-3px_var(--primary)]"
                    : "bg-card/50 text-muted-foreground/30 border border-border/20 cursor-not-allowed"
                )}
                aria-label="Next card"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto pb-14 md:overflow-hidden md:pb-12">
            <CardDetailsV2
              card={currentCard}
              displayCard={displayCard}
              backCard={currentBackCard ?? null}
              hasBack={Boolean(currentBackCard)}
              isFlipped={isFlipped}
              onToggleFlip={() => setIsFlipped((v) => !v)}
            />
          </div>

          <DialogFooter className="justify-start gap-3">
            <DeckSectionControls card={currentCard} layout="horizontal" />

            <div className="ml-auto flex items-center gap-3">
              {hasNavigation && (
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {currentIndex + 1} / {cards!.length}
                </span>
              )}

              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  <span className="text-xs font-mono uppercase tracking-wider">Close</span>
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
