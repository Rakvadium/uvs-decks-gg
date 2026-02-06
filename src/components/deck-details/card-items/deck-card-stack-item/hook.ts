import { useMemo } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useCardDetailsDialogTrigger } from "../hooks";
import type { DeckCardStackItemProps } from "./types";

export function useDeckCardStackItemModel({ card, quantity, backCard }: DeckCardStackItemProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isDialogOpen, setIsDialogOpen, openDialog, handleKeyDownOpen } = useCardDetailsDialogTrigger();

  const stackCount = Math.max(1, quantity);
  const stackOffset = 6;

  const stackedLayers = useMemo(
    () => Array.from({ length: Math.max(0, stackCount - 1) }, (_, index) => index + 1),
    [stackCount]
  );

  return {
    card,
    quantity,
    backCard,
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
