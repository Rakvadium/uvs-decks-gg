import { useCallback, useMemo, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useCardDetailsDialogTrigger } from "../hooks";
import type { DeckCardStackItemProps } from "./types";

export function useDeckCardStackItemModel({ card, quantity, backCard }: DeckCardStackItemProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isDialogOpen, setIsDialogOpen, openDialog, handleKeyDownOpen } = useCardDetailsDialogTrigger();

  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const stackCount = Math.max(1, quantity);
  const stackOffset = 2;

  const stackedLayers = useMemo(
    () => Array.from({ length: Math.min(4, Math.max(0, stackCount - 1)) }, (_, i) => i + 1),
    [stackCount]
  );

  const hasBack = Boolean(card.backCardId) && Boolean(backCard);
  const displayCard = isFlipped && backCard ? backCard : card;

  const handleFlip = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!backCard) return;
      setIsFlipped((v) => !v);
    },
    [backCard]
  );

  return {
    card,
    displayCard,
    quantity,
    backCard,
    hasBack,
    isFlipped,
    isHovered,
    setIsHovered,
    handleFlip,
    prefersReducedMotion,
    isDialogOpen,
    setIsDialogOpen,
    openDialog,
    handleKeyDownOpen,
    stackedLayers,
    stackOffset,
  };
}

export type DeckCardStackItemModel = ReturnType<typeof useDeckCardStackItemModel>;
