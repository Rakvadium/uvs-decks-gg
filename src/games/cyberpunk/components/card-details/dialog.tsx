"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useConvexAuth } from "convex/react";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { GalleryGuestDeckAuthPrompt } from "@/components/gallery/gallery-guest-deck-auth-prompt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { GameCardDetailsDialogProps } from "@/games/types";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { cn } from "@/lib/utils";
import { CardImageDisplay } from "../card-image-display";
import { CyberpunkCardDeckBar } from "./deck-bar";
import { CyberpunkCardReadout } from "./readout";

const HERO_SIZES = "(max-width: 768px) min(92vw, 340px), 340px";

function navButtonClassName(enabled: boolean) {
  return cn(
    "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
    enabled
      ? "border-[var(--chrome-dialog-nav-border-enabled)] bg-card/95 text-primary shadow-[var(--chrome-dialog-nav-shadow-enabled)] hover:border-primary/60 hover:bg-primary/20"
      : "cursor-not-allowed border-border/30 bg-card/50 text-muted-foreground/30"
  );
}

/** Card details modal: art (or text frame), readout, deck controls; arrow keys page through `cards`. */
export function CardDetailsDialog({
  card,
  backCard,
  open,
  onOpenChange,
  cards,
  getBackCard,
}: GameCardDetailsDialogProps) {
  // Paging state is keyed by the card the dialog was opened on; reset (during render) when it changes.
  const anchorId = open && card ? card._id : null;
  const [paging, setPaging] = useState<{ anchorId: string | null; index: number | null }>({
    anchorId,
    index: null,
  });
  if (paging.anchorId !== anchorId) setPaging({ anchorId, index: null });
  const anchorIndex = anchorId && cards ? cards.findIndex((c) => c._id === anchorId) : -1;
  const currentIndex = paging.anchorId === anchorId && paging.index !== null ? paging.index : anchorIndex;
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const deckDetails = useDeckDetailsOptional();
  const canEditViewedDeck = deckDetails?.isOwner ?? true;

  const canGoPrev = Boolean(cards && currentIndex > 0);
  const canGoNext = Boolean(cards && currentIndex >= 0 && currentIndex < cards.length - 1);
  const hasNavigation = Boolean(cards && cards.length > 1 && currentIndex >= 0);

  const goToPrev = useCallback(() => {
    if (canGoPrev) setPaging({ anchorId, index: currentIndex - 1 });
  }, [anchorId, canGoPrev, currentIndex]);
  const goToNext = useCallback(() => {
    if (canGoNext) setPaging({ anchorId, index: currentIndex + 1 });
  }, [anchorId, canGoNext, currentIndex]);

  useEffect(() => {
    if (!open || !hasNavigation) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasNavigation, goToPrev, goToNext]);

  const currentCard = cards && currentIndex >= 0 ? cards[currentIndex] : card;
  if (!currentCard) return null;

  const currentBack =
    cards && currentIndex >= 0 && getBackCard ? (getBackCard(cards[currentIndex]) ?? null) : (backCard ?? null);
  const isFlipped = flippedCardId === currentCard._id;
  const displayCard = isFlipped && currentBack ? currentBack : currentCard;
  const showGuestPrompt = canEditViewedDeck && !isAuthLoading && !isAuthenticated;

  const prevButton = hasNavigation ? (
    <button type="button" onClick={goToPrev} disabled={!canGoPrev} className={navButtonClassName(canGoPrev)} aria-label="Previous card">
      <ChevronLeft className="h-5 w-5" />
    </button>
  ) : null;
  const nextButton = hasNavigation ? (
    <button type="button" onClick={goToNext} disabled={!canGoNext} className={navButtonClassName(canGoNext)} aria-label="Next card">
      <ChevronRight className="h-5 w-5" />
    </button>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        presentation="plain"
        showCloseButton={false}
        className="max-h-[90vh] overflow-hidden p-0 md:w-[min(82vw,1080px)] md:min-w-[min(82vw,1080px)] md:max-w-[min(82vw,1080px)] md:pb-0"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("[data-card-dialog-nav]")) event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">{displayCard.name} - Card Details</DialogTitle>

        {/* Sized to content like the UVS dialog (flex-1 + max-h, no fixed height); the readout scrolls past the cap. */}
        <div className="flex w-full flex-col gap-4 p-3 max-md:h-full max-md:min-h-0 max-md:overflow-y-auto max-md:overscroll-contain md:max-h-[min(85vh,calc(100dvh-2rem))] md:min-h-0 md:flex-1 md:flex-row md:items-stretch md:gap-5 md:overflow-hidden md:pt-12">
          <div className="flex w-full shrink-0 flex-col items-center md:w-[340px] md:justify-center">
            <div className="flex w-full items-center justify-center gap-3">
              <div className={cn("shrink-0 justify-center md:hidden", prevButton ? "flex w-10" : "hidden")}>{prevButton}</div>
              <div className="relative aspect-[2.5/3.5] w-full max-w-[260px] overflow-hidden rounded-2xl md:max-w-[340px]" style={{ boxShadow: "var(--chrome-card-image-glow-rest)" }}>
                <CardImageDisplay imageUrl={displayCard.imageUrl} name={displayCard.name} card={displayCard} sizes={HERO_SIZES} priority />
                {currentBack ? (
                  <button
                    type="button"
                    onClick={() => setFlippedCardId(isFlipped ? null : currentCard._id)}
                    className="chrome-label-case absolute bottom-0 right-0 z-10 flex items-center gap-2 rounded-tl-2xl border border-primary/40 bg-card/95 px-3 py-2 text-[10px] text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    <RotateCcw className={cn("h-3.5 w-3.5", isFlipped && "rotate-180")} />
                    {isFlipped ? "Front" : "Back"}
                  </button>
                ) : null}
              </div>
              <div className={cn("shrink-0 justify-center md:hidden", nextButton ? "flex w-10" : "hidden")}>{nextButton}</div>
            </div>
          </div>

          <div className="relative flex min-w-0 flex-col max-md:flex-none md:min-h-0 md:flex-1">
            <div className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-primary/40 bg-card/95 backdrop-blur-md max-md:overflow-visible md:h-full md:min-h-0 md:flex-1">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-0 z-30 hidden h-9 w-9 rounded-none rounded-bl-xl rounded-tr-xl !border-primary/40 bg-card/95 shadow-none md:inline-flex"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain max-md:overflow-visible">
                <CyberpunkCardReadout card={displayCard} />
                {showGuestPrompt ? (
                  <div className="px-5 pb-5 md:px-8">
                    <GalleryGuestDeckAuthPrompt compact />
                  </div>
                ) : null}
              </div>
              {showGuestPrompt ? null : (
                <div className="flex shrink-0 justify-start border-t border-border/30 px-3 py-2 empty:hidden">
                  <CyberpunkCardDeckBar key={currentCard._id} card={currentCard} />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {open && typeof document !== "undefined"
        ? createPortal(
            <DialogClose
              data-card-dialog-nav
              className={cn(
                "pointer-events-auto fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] md:hidden",
                navButtonClassName(true)
              )}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogClose>,
            document.body
          )
        : null}

      {hasNavigation && open && typeof document !== "undefined"
        ? createPortal(
            <div
              data-card-dialog-nav
              className="pointer-events-none fixed inset-0 z-[60] hidden items-center justify-between px-4 md:flex md:px-8"
            >
              <button type="button" onClick={goToPrev} disabled={!canGoPrev} className={cn("pointer-events-auto md:h-12 md:w-12", navButtonClassName(canGoPrev))} aria-label="Previous card">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={goToNext} disabled={!canGoNext} className={cn("pointer-events-auto md:h-12 md:w-12", navButtonClassName(canGoNext))} aria-label="Next card">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>,
            document.body
          )
        : null}
    </Dialog>
  );
}
