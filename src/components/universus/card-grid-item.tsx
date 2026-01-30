"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CachedCard } from "@/lib/universus";
import { cn } from "@/lib/utils";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { usePrefersReducedMotion } from "../../lib/reduced-motion";

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
        showBorder && "ring-2 ring-primary"
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
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">No Image</span>
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
  const prefersReducedMotion = usePrefersReducedMotion();
  const { hasActiveDeck, getCardCount, addCard, removeCard } = useActiveDeck();
  const deckCount = getCardCount(card._id);
  const hasBackCardId = !!card.backCardId;
  const hasBackCardData = !!backCard;
  const showDeckCount = hasActiveDeck && deckCount > 0;

  const handleFlip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasBackCardData) return;
    setIsFlipped((prev) => !prev);
  }, [hasBackCardData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!hasBackCardData) return;
      setIsFlipped((prev) => !prev);
    }
  }, [hasBackCardData]);

  return (
    <div
      className={cn(
        "relative aspect-[2.5/3.5] cursor-pointer",
        "[perspective:1000px]",
        prefersReducedMotion ? "transition-none" : "transition-[transform] duration-200",
        isHovered && !prefersReducedMotion && "scale-105 z-10"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div
        className={cn(
          "relative w-full h-full",
          "[transform-style:preserve-3d]",
          prefersReducedMotion ? "transition-none" : "transition-[transform] duration-500",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        <CardFace
          imageUrl={card.imageUrl}
          name={card.name}
          isFront={true}
          showBorder={isHovered}
        />
        
        {hasBackCardData && (
          <CardFace
            imageUrl={backCard.imageUrl}
            name={backCard.name}
            isFront={false}
            showBorder={isHovered}
          />
        )}
      </div>

      {hasBackCardId && (
        <div
          className={cn(
            "absolute top-1.5 left-1.5 transition-opacity duration-200 z-10",
            isHovered ? "opacity-100" : "opacity-85"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 bg-black/60 hover:bg-black/80 border-0"
                onClick={handleFlip}
                disabled={!hasBackCardData}
              >
                <RotateCcw className={cn(
                  "h-3.5 w-3.5 text-white",
                  prefersReducedMotion ? "" : "transition-transform duration-300",
                  isFlipped && "rotate-180"
                )} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isFlipped ? "View front" : "View back"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {showDeckCount && (
        <div
          className={cn(
            "absolute top-1.5 right-1.5 transition-opacity duration-200 z-10",
            isHovered ? "opacity-100" : "opacity-85"
          )}
        >
          <div className="h-7 min-w-7 px-2 rounded-md bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
            {deckCount}
          </div>
        </div>
      )}

      {hasActiveDeck && isHovered && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-center gap-1 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/60 hover:bg-black/80 border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCard(card._id);
                }}
                disabled={deckCount === 0}
              >
                <Minus className="h-4 w-4 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove from deck</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/60 hover:bg-black/80 border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  addCard(card._id);
                }}
              >
                <Plus className="h-4 w-4 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to deck</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
