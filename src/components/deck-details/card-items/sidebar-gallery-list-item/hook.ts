import { useCallback } from "react";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useTcgDraggable } from "@/lib/dnd";
import { useCardDetailsDialogTrigger, useDeckSectionCounts, useDragClickGuard } from "../hooks";
import type { SidebarGalleryListItemProps } from "./types";

export function useSidebarGalleryListItemModel({ card, backCard, onHoverCard, onClearHover }: SidebarGalleryListItemProps) {
  const { addCard, getCardCount, removeCard } = useDeckEditor();
  const sectionCounts = useDeckSectionCounts();
  const { isDialogOpen, setIsDialogOpen, openDialog, handleKeyDownOpen } = useCardDetailsDialogTrigger();

  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: "deck-details-gallery-list",
  });

  const { canOpenDialog } = useDragClickGuard(isDragging);

  const quantity = getCardCount(card._id);
  const canAddToMain = canAddCardToSection({
    card,
    cardId: card._id,
    section: "main",
    counts: sectionCounts,
  });

  const handleOpen = useCallback(() => {
    if (!canOpenDialog()) return;
    openDialog();
  }, [canOpenDialog, openDialog]);

  return {
    card,
    backCard,
    quantity,
    canAddToMain,
    isDragging,
    dragHandleProps,
    canOpenDialog,
    isDialogOpen,
    setIsDialogOpen,
    handleOpen,
    handleKeyDownOpen,
    onHoverCard,
    onClearHover,
    addCard,
    removeCard,
  };
}

export type SidebarGalleryListItemModel = ReturnType<typeof useSidebarGalleryListItemModel>;
