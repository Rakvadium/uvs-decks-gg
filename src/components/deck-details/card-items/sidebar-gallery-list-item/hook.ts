import { useCallback, useRef } from "react";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useTcgDraggable } from "@/lib/dnd";
import { useGameModule } from "@/games/game-context";
import { useCardDetailsDialogTrigger, useDeckSectionCounts, useDragClickGuard } from "../hooks";
import type { SidebarGalleryListItemProps } from "./types";

export function useSidebarGalleryListItemModel(props: SidebarGalleryListItemProps) {
  const { card, backCard, onHoverCard, onClearHover } = props;
  const { addCard, getCardCount, removeCard } = useDeckEditor();
  const sectionCounts = useDeckSectionCounts();
  const gameDeck = useGameModule().deck;
  const { isDialogOpen, setIsDialogOpen, openDialog, handleKeyDownOpen } = useCardDetailsDialogTrigger();

  const dragPreviewImageRef = useRef<HTMLImageElement | null>(null);
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: "deck-details-gallery-list",
    previewImageRef: dragPreviewImageRef,
  });

  const { canOpenDialog } = useDragClickGuard(isDragging);

  const handleOpen = useCallback(() => {
    if (!canOpenDialog()) return;
    openDialog();
  }, [canOpenDialog, openDialog]);

  const quantity = getCardCount(card._id);
  const canAddToMain = canAddCardToSection({
    card,
    cardId: card._id,
    section: "main",
    counts: sectionCounts,
    rules: gameDeck,
  });

  return {
    card,
    backCard,
    quantity,
    canAddToMain,
    addCard,
    removeCard,
    isDragging,
    dragHandleProps,
    dragPreviewImageRef,
    canOpenDialog,
    isDialogOpen,
    setIsDialogOpen,
    handleOpen,
    handleKeyDownOpen,
    onHoverCard,
    onClearHover,
  };
}

export type SidebarGalleryListItemModel = ReturnType<typeof useSidebarGalleryListItemModel>;
