import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canAddCardToSection, canMoveCardToSection } from "@/lib/deck";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  DECK_SECTION_KEYS,
  type DeckSection,
} from "@/lib/deck/display-config";
import { useTcgDraggable } from "@/lib/dnd";
import { useActiveDeckSectionsContext } from "../sections-context";
import type { ActiveDeckCardRowProps } from "./types";

export function useActiveDeckCardRowModel({ card, count, sectionKey }: ActiveDeckCardRowProps) {
  const isMobile = useIsMobile();
  const {
    addCard,
    getBackCard,
    moveCard,
    onHoverEnter,
    onHoverLeave,
    onHoverMove,
    removeCard,
    sectionCounts,
  } = useActiveDeckSectionsContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dragBlockRef = useRef(false);

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

  const dragPreviewImageRef = useRef<HTMLImageElement | null>(null);
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: `active-deck:${sectionKey}`,
    previewImageRef: dragPreviewImageRef,
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
    return undefined;
  }, [isDragging]);

  const handleCardClick = useCallback(() => {
    if (dragBlockRef.current) return;
    setIsDialogOpen(true);
  }, []);

  const backCard = getBackCard(card);

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
    if (isMobile) return;
    onHoverEnter(card, rect);
  };

  const handlePointerMove = (rect: DOMRect) => {
    if (isMobile) return;
    onHoverMove(rect);
  };

  return {
    card,
    backCard,
    count,
    sectionKey,
    moveTargets,
    isMobile,
    isDragging,
    dragPreviewImageRef,
    dragHandleProps,
    canAddToDeck,
    canMoveToSection,
    handlePointerEnter,
    handlePointerMove,
    handleCardClick,
    onHoverLeave,
    addCard,
    removeCard,
    moveCard,
    isDialogOpen,
    setIsDialogOpen,
  };
}

export type ActiveDeckCardRowModel = ReturnType<typeof useActiveDeckCardRowModel>;
