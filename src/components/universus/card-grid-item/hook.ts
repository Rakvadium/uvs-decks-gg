import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useTcgDraggable } from "@/lib/dnd";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import type { CardGridItemProps } from "./types";

export function useCardGridItem({ card, backCard, onCardClick }: CardGridItemProps) {
  const isMobile = useIsMobile();
  const [usesTouchControls, setUsesTouchControls] = useState(false);
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

  const hasBackCardId = Boolean(card.backCardId);
  const hasBackCardData = Boolean(backCard);
  const displayCard = isFlipped && backCard ? backCard : card;
  const showDeckCount = hasDeck && deckCount > 0;
  const showInlineControls = isMobile || usesTouchControls;

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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setUsesTouchControls(event.matches);
    };

    handleChange(mediaQuery);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleFlip = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!hasBackCardData) return;
      setIsFlipped((value) => !value);
    },
    [hasBackCardData]
  );

  const handleCardClick = useCallback(() => {
    if (dragBlockRef.current) return;
    if (onCardClick) {
      void onCardClick(card);
    } else {
      setIsDialogOpen(true);
    }
  }, [card, onCardClick]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (onCardClick) {
          void onCardClick(card);
        } else {
          setIsDialogOpen(true);
        }
      }
    },
    [card, onCardClick]
  );

  const addToDeck = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      addCard(card._id);
    },
    [addCard, card._id]
  );

  const removeFromDeck = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      removeCard(card._id);
    },
    [removeCard, card._id]
  );

  return {
    card,
    backCard,
    displayCard,
    dragHandleProps,
    hasBackCardData,
    hasBackCardId,
    hasDeck,
    isDialogOpen,
    isDragging,
    isMobile: showInlineControls,
    isFlipped,
    isHovered,
    prefersReducedMotion,
    showDeckCount,
    deckCount,
    canAddToDeck,
    setIsDialogOpen,
    setIsHovered,
    handleFlip,
    handleCardClick,
    handleKeyDown,
    addToDeck,
    removeFromDeck,
  };
}
