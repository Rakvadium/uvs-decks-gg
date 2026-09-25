import { useCallback, useEffect, useRef, useState } from "react";
import { useDeckEditor } from "@/lib/deck";
import { useGameModule } from "@/games/game-context";
import { useTcgDraggable } from "@/lib/dnd";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import type { CardGridItemProps } from "./types";

export function useCardGridItem({
  card,
  backCard,
  onCardClick,
  onOpenCardDetails,
  dragSourceId = "gallery-grid",
  showDeckActions = true,
  imagePriority = false,
  imageSizes,
  imageQuality,
}: CardGridItemProps) {
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
  } = useDeckEditor();
  const { deck: deckRules } = useGameModule();
  const dragPreviewImageRef = useRef<HTMLImageElement | null>(null);
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: dragSourceId,
    previewImageRef: dragPreviewImageRef,
  });

  const dragBlockRef = useRef(false);
  const deckCount = getCardCount(card._id);

  // Main-deck add: the game's eligibility + copy limit over main + side (UVS: same rules as
  // `canAddCardToSection(..., "main")`).
  const mainSideCount = (mainCounts[card._id] ?? 0) + (sideCounts[card._id] ?? 0);
  const canAddToDeck =
    deckRules.isMainDeckEligible(card) && mainSideCount + 1 <= deckRules.getCardCopyLimit(card);

  const hasBackCardId = Boolean(card.backCardId);
  const hasBackCardData = Boolean(backCard);
  const displayCard = isFlipped && backCard ? backCard : card;
  const deckInteractionsEnabled = showDeckActions && hasDeck;
  const showDeckCount = deckInteractionsEnabled && deckCount > 0;
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
    } else if (onOpenCardDetails) {
      onOpenCardDetails(card);
    } else {
      setIsDialogOpen(true);
    }
  }, [card, onCardClick, onOpenCardDetails]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (onCardClick) {
          void onCardClick(card);
        } else if (onOpenCardDetails) {
          onOpenCardDetails(card);
        } else {
          setIsDialogOpen(true);
        }
      }
    },
    [card, onCardClick, onOpenCardDetails]
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
    imagePriority,
    imageSizes,
    imageQuality,
    displayCard,
    dragPreviewImageRef,
    dragHandleProps,
    hasBackCardData,
    hasBackCardId,
    hasDeck: deckInteractionsEnabled,
    isDialogOpen,
    isDragging,
    isMobile: showInlineControls,
    isFlipped,
    isHovered,
    prefersReducedMotion,
    showDeckCount,
    deckCount,
    canAddToDeck: deckInteractionsEnabled ? canAddToDeck : false,
    setIsDialogOpen,
    setIsHovered,
    handleFlip,
    handleCardClick,
    handleKeyDown,
    addToDeck,
    removeFromDeck,
  };
}
