"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { RotateCcw, Plus, Minus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CachedCard } from "@/lib/universus";
import { cn } from "@/lib/utils";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useTcgDraggable } from "@/lib/dnd";
import { usePrefersReducedMotion } from "../../lib/reduced-motion";
import { CardDetailsDialog } from "./card-details-dialog";

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

interface CardFaceProps {
  imageUrl: string | undefined;
  name: string;
  isFront: boolean;
  showBorder?: boolean;
}

function CardFace({ imageUrl, name, isFront, showBorder }: CardFaceProps) {
  const hasValidImageUrl = imageUrl && isValidUrl(imageUrl);

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-lg overflow-hidden",
        "[backface-visibility:hidden]",
        !isFront && "[transform:rotateY(180deg)]",
        showBorder && "ring-2 ring-primary shadow-[0_0_20px_var(--primary)]"
      )}
    >
      {hasValidImageUrl ? (
        <Image
          src={imageUrl!}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          className="object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/50 border border-border/50">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded border border-primary/30 flex items-center justify-center">
              <span className="text-primary/50 text-lg">?</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">No Image</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface CardGridItemProps {
  card: CachedCard;
  backCard?: CachedCard | null;
}

export function CardGridItem({
  card,
  backCard,
}: CardGridItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    sourceId: "gallery-grid",
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
  const hasBackCardId = !!card.backCardId;
  const hasBackCardData = !!backCard;
  const displayCard = isFlipped && backCard ? backCard : card;
  const showDeckCount = hasDeck && deckCount > 0;

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

  const handleFlip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasBackCardData) return;
    setIsFlipped((prev) => !prev);
  }, [hasBackCardData]);

  const handleCardClick = useCallback(() => {
    if (dragBlockRef.current) return;
    setIsDialogOpen(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsDialogOpen(true);
    }
  }, []);

  return (
    <>
      <div
        className={cn(
          "group relative aspect-[2.5/3.5] cursor-pointer",
          "[perspective:1000px]",
          prefersReducedMotion ? "transition-none" : "transition-all duration-300",
          isHovered && !prefersReducedMotion && "scale-105 z-10",
          isDragging && "scale-[0.98] opacity-60"
        )}
        style={{
          ...dragHandleProps.style,
          cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onDragStart={(event) => event.preventDefault()}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        onMouseDown={dragHandleProps.onMouseDown}
        onTouchStart={dragHandleProps.onTouchStart}
      >
        <div
          className={cn(
            "absolute -inset-1 rounded-xl opacity-0 blur-md transition-opacity duration-300",
            "bg-gradient-to-r from-primary via-secondary to-primary",
            isHovered && "opacity-40"
          )}
        />

        <div
          className={cn(
            "relative w-full h-full rounded-lg overflow-hidden",
            "shadow-[0_0_6px_-2px_var(--primary)/20]",
            isHovered && "shadow-[0_0_15px_-3px_var(--primary)/60]"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isFlipped ? "back" : "front"}
              initial={prefersReducedMotion ? {} : { rotateY: -90, opacity: 0 }}
              animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
              exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "absolute inset-0 rounded-lg overflow-hidden",
                "[backface-visibility:hidden]"
              )}
            >
              {displayCard.imageUrl ? (
                <Image
                  src={displayCard.imageUrl}
                  alt={displayCard.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  className="object-cover"
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/50 border border-border/50">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded border border-primary/30 flex items-center justify-center">
                      <span className="text-primary/50 text-lg">?</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">No Image</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div
            className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-lg",
              "bg-gradient-to-t from-background/80 via-transparent to-transparent",
              isHovered ? "opacity-25" : "opacity-0"
            )}
          />

          <div
            className={cn(
              "absolute inset-0 pointer-events-none rounded-lg",
              "bg-[linear-gradient(135deg,transparent_40%,var(--primary)/10_50%,transparent_60%)]",
              "opacity-0 transition-opacity duration-300",
              isHovered && "opacity-100"
            )}
            style={{
              backgroundSize: "200% 200%",
              animation: isHovered && !prefersReducedMotion ? "holo-shimmer 3s ease-in-out infinite" : "none",
            }}
          />
        </div>

        {hasBackCardId && (
          <div
            className={cn(
              "absolute top-1.5 left-1.5 transition-all duration-200 z-10",
              isHovered ? "opacity-100 scale-100" : "opacity-70 scale-90"
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 bg-background/80 backdrop-blur-sm border-primary/40 hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_10px_var(--primary)]"
                  onClick={handleFlip}
                  disabled={!hasBackCardData}
                >
                  <RotateCcw className={cn(
                    "h-3.5 w-3.5 text-primary",
                    prefersReducedMotion ? "" : "transition-transform duration-300",
                    isFlipped && "rotate-180"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-mono uppercase tracking-wider text-xs">
                <p>{isFlipped ? "View Front" : "View Back"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {showDeckCount && (
          <div
            className={cn(
              "absolute top-1.5 right-1.5 transition-all duration-200 z-10",
              isHovered ? "opacity-100 scale-100" : "opacity-85 scale-95"
            )}
          >
            <div className="h-7 min-w-7 px-2.5 rounded bg-primary/90 text-primary-foreground text-sm font-mono font-bold flex items-center justify-center shadow-[0_0_15px_var(--primary)] border border-primary">
              {deckCount}
            </div>
          </div>
        )}

        {hasDeck && isHovered && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background/80 backdrop-blur-sm border-destructive/40 hover:border-destructive hover:bg-destructive/20 hover:shadow-[0_0_10px_var(--destructive)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCard(card._id);
                  }}
                  disabled={deckCount === 0}
                >
                  <Minus className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-mono uppercase tracking-wider text-xs">
                <p>Remove</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background/80 backdrop-blur-sm border-primary/40 hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_10px_var(--primary)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    addCard(card._id);
                  }}
                  disabled={!canAddToDeck}
                >
                  <Plus className="h-4 w-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-mono uppercase tracking-wider text-xs">
                <p>Add</p>
              </TooltipContent>
            </Tooltip>
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
