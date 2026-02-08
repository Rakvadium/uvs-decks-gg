"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CachedCard } from "@/lib/universus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DeckSectionControls } from "./deck-section-controls";
import { useCardDetailsVariant } from "./use-card-details-variant";
import { VariantSelector } from "./variant-selector";
import { CardDetailsV1 } from "./variants/v1";
import { CardDetailsV2 } from "./variants/v2";
import { CardDetailsV3 } from "./variants/v3";
import { CardDetailsV4 } from "./variants/v4";
import { CardDetailsV5 } from "./variants/v5";

interface CardDetailsDialogProps {
  card: CachedCard | null;
  backCard?: CachedCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards?: CachedCard[];
  getBackCard?: (card: CachedCard) => CachedCard | null | undefined;
}

const VARIANT_COMPONENTS = {
  v1: CardDetailsV1,
  v2: CardDetailsV2,
  v3: CardDetailsV3,
  v4: CardDetailsV4,
  v5: CardDetailsV5,
};

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
  const { variant } = useCardDetailsVariant();

  // Sync current index when card changes or dialog opens
  useEffect(() => {
    if (!open || !card || !cards?.length) {
      setCurrentIndex(-1);
      return;
    }
    const idx = cards.findIndex((c) => c._id === card._id);
    setCurrentIndex(idx);
  }, [open, card, cards]);

  // Reset flip when navigating
  useEffect(() => {
    setIsFlipped(false);
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
  const VariantComponent = VARIANT_COMPONENTS[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="max-h-[90vh] overflow-hidden p-0 md:pb-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{displayCard.name} - Card Details</DialogTitle>

        <VariantComponent
          card={currentCard}
          displayCard={displayCard}
          backCard={currentBackCard ?? null}
          hasBack={Boolean(currentBackCard)}
          isFlipped={isFlipped}
          onToggleFlip={() => setIsFlipped((v) => !v)}
        />

        <div className="flex items-center gap-3 border-t border-border/20 px-4 py-2">
          <DeckSectionControls card={currentCard} layout="horizontal" />

          <div className="ml-auto flex items-center gap-3">
            <VariantSelector />

            {hasNavigation && (
              <span className="text-[10px] font-mono text-muted-foreground/50">
                {currentIndex + 1} / {cards!.length}
              </span>
            )}

            <DialogClose asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <span className="text-xs font-mono uppercase tracking-wider">Close</span>
              </Button>
            </DialogClose>

            <DialogClose asChild className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <span className="text-xs font-mono uppercase tracking-wider">Close</span>
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>

      {hasNavigation && open && typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-between px-4 md:px-8">
            <button
              type="button"
              onClick={goToPrev}
              disabled={!canGoPrev}
              className={cn(
                "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full transition-all md:h-12 md:w-12 z-[60]",
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
                "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full transition-all md:h-12 md:w-12 z-[60]",
                canGoNext
                  ? "bg-card/90 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_15px_-3px_var(--primary)]"
                  : "bg-card/50 text-muted-foreground/30 border border-border/20 cursor-not-allowed"
              )}
              aria-label="Next card"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>,
          document.body
        )}
    </Dialog>
  );
}
