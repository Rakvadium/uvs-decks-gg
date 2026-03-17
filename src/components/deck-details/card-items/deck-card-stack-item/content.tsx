"use client";

import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CardDetailsDialog } from "@/components/universus";
import { CardFlipButton } from "@/components/universus/card-item/flip-button";
import { CARD_GLOW_REST, CARD_GLOW_HOVER } from "@/components/universus/card-item/glow";
import { CardImageDisplay } from "@/components/universus/card-grid-item/image-display";
import { cn } from "@/lib/utils";
import { DeckCardStackItemActions } from "./actions";
import { useDeckCardStackItemModel } from "./hook";
import type { DeckCardStackItemProps } from "./types";

export function DeckCardStackItem(props: DeckCardStackItemProps) {
  const {
    backCard,
    card,
    displayCard,
    handleFlip,
    handleKeyDownOpen,
    hasBack,
    isDialogOpen,
    isFlipped,
    isHovered,
    setIsHovered,
    openDialog,
    prefersReducedMotion,
    quantity,
    setIsDialogOpen,
    stackedLayers,
    stackOffset,
  } = useDeckCardStackItemModel(props);

  return (
    <>
      <div
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative pb-3 pr-3">
          <div
            className={cn(
              "relative aspect-[2.5/3.5] overflow-visible [perspective:1000px]",
              "transition-transform duration-150",
              !prefersReducedMotion && "group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
            )}
          >
            {stackedLayers.map((layer) => (
              <div
                key={layer}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-lg border border-border/60 bg-muted/60"
                style={{
                  transform: `translate(${layer * stackOffset}px, ${layer * stackOffset}px)`,
                  opacity: Math.max(0.4, 0.85 - layer * 0.12),
                  boxShadow: "1px 1px 0 0 hsl(var(--border) / 0.4)",
                }}
              />
            ))}

            <div
              className="absolute inset-0 z-10 overflow-hidden rounded-lg transition-shadow duration-150"
              style={{ boxShadow: isHovered ? CARD_GLOW_HOVER : CARD_GLOW_REST }}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={false}
                  animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 [backface-visibility:hidden]"
                >
                  <CardImageDisplay imageUrl={displayCard.imageUrl} name={displayCard.name} />
                </motion.div>
              </AnimatePresence>
            </div>

            {hasBack && (
              <CardFlipButton
                isFlipped={isFlipped}
                isHovered={isHovered}
                prefersReducedMotion={prefersReducedMotion}
                onFlip={handleFlip}
              />
            )}

            <DeckCardStackItemActions card={card} quantity={quantity} isHovered={isHovered} />

            <button
              type="button"
              onClick={openDialog}
              onKeyDown={handleKeyDownOpen as unknown as (event: KeyboardEvent<HTMLButtonElement>) => void}
              className="absolute inset-0 z-20 cursor-pointer rounded-lg"
              aria-label={`Open ${card.name} details`}
            />
          </div>
        </div>
      </div>

      <CardDetailsDialog card={card} backCard={backCard} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
