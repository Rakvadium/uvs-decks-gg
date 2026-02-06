import { useMemo } from "react";
import { canAddCardToSection, canMoveCardToSection } from "@/lib/deck";
import {
  DECK_SECTION_KEYS,
  type DeckSection,
} from "@/lib/deck/display-config";
import { useTcgDraggable } from "@/lib/dnd";
import { useActiveDeckSectionsContext } from "../sections-context";
import type { ActiveDeckCardRowProps } from "./types";

export function useActiveDeckCardRowModel({ card, count, sectionKey }: ActiveDeckCardRowProps) {
  const {
    addCard,
    moveCard,
    onHoverEnter,
    onHoverLeave,
    onHoverMove,
    removeCard,
    sectionCounts,
  } = useActiveDeckSectionsContext();

  const canAddToDeck = canAddCardToSection({
    card,
    cardId: card._id,
    section: sectionKey,
    counts: sectionCounts,
  });

  const moveTargets = useMemo(
    () => DECK_SECTION_KEYS.filter((key) => key !== sectionKey),
    [sectionKey]
  );

  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: `active-deck:${sectionKey}`,
  });

  const canMoveToSection = (target: DeckSection) => {
    if (count <= 0) return false;

    return canMoveCardToSection({
      card,
      cardId: card._id,
      fromSection: sectionKey,
      toSection: target,
      counts: sectionCounts,
    });
  };

  const handlePointerEnter = (rect: DOMRect) => {
    onHoverEnter(card, rect);
  };

  const handlePointerMove = (rect: DOMRect) => {
    onHoverMove(rect);
  };

  return {
    card,
    count,
    sectionKey,
    moveTargets,
    isDragging,
    dragHandleProps,
    canAddToDeck,
    canMoveToSection,
    handlePointerEnter,
    handlePointerMove,
    onHoverLeave,
    addCard,
    removeCard,
    moveCard,
  };
}

export type ActiveDeckCardRowModel = ReturnType<typeof useActiveDeckCardRowModel>;
