import { useCallback, useEffect, useMemo, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { canAddCardToSection, canMoveCardToSection, useDeckEditor } from "@/lib/deck";
import { DECK_SECTION_KEYS, type DeckSection } from "@/lib/deck/display-config";
import { useTcgDraggable } from "@/lib/dnd";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useDeckCardsSectionContext } from "../../deck-details-cards-section-context";
import { useCardDetailsDialogTrigger, useDeckSectionCounts } from "../hooks";
import type { DeckDetailsListCardRowProps } from "./types";

export function useDeckDetailsListCardRowModel({ entry }: DeckDetailsListCardRowProps) {
  const isMobile = useIsMobile();
  const deckDetails = useDeckDetailsOptional();
  const isOwner = deckDetails?.isOwner ?? false;
  const { activeSection, onHoverListCard, onClearListCardHover } = useDeckCardsSectionContext();
  const { addCard, moveCard, removeCard } = useDeckEditor();
  const sectionCounts = useDeckSectionCounts();

  const { card, quantity: count, backCard: entryBack } = entry;
  const backCard = entryBack ?? null;
  const sectionKey = activeSection;

  const dragBlockRef = useRef(false);

  const { isDialogOpen, setIsDialogOpen, openDialog } = useCardDetailsDialogTrigger();

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
    sourceId: `deck-details-list:${sectionKey}`,
    previewImageRef: dragPreviewImageRef,
    isDisabled: !isOwner,
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
    openDialog();
  }, [openDialog]);

  const canMoveToSection = useCallback(
    (target: DeckSection) => {
      if (count <= 0) return false;
      return canMoveCardToSection({
        card,
        cardId: card._id,
        fromSection: sectionKey,
        toSection: target,
        counts: sectionCounts,
      });
    },
    [card, count, sectionKey, sectionCounts]
  );

  const handlePointerEnter = useCallback(
    (rect: DOMRect) => {
      if (isMobile) return;
      onHoverListCard(card, rect);
    },
    [isMobile, onHoverListCard, card]
  );

  const handlePointerMove = useCallback(
    (rect: DOMRect) => {
      if (isMobile) return;
      onHoverListCard(card, rect);
    },
    [isMobile, onHoverListCard, card]
  );

  return {
    card,
    backCard,
    count,
    sectionKey,
    isOwner,
    moveTargets,
    isDragging,
    dragPreviewImageRef,
    dragHandleProps,
    canAddToDeck,
    canMoveToSection,
    handlePointerEnter,
    handlePointerMove,
    onHoverLeave: onClearListCardHover,
    addCard,
    removeCard,
    moveCard,
    isDialogOpen,
    setIsDialogOpen,
    handleCardClick,
  };
}

export type DeckDetailsListCardRowModel = ReturnType<typeof useDeckDetailsListCardRowModel>;
