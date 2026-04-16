import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTcgDraggable } from "@/lib/dnd";
import { useGalleryCardMap } from "../card-map-context";
import type { CardListItemProps } from "./types";

export function useCardListItemModel({ card, onOpenCardDetails, thumbnailPriority = false }: CardListItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getBackCard } = useGalleryCardMap();
  const backCard = getBackCard(card);

  const dragPreviewImageRef = useRef<HTMLImageElement | null>(null);
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: "gallery-list",
    previewImageRef: dragPreviewImageRef,
  });

  const dragBlockRef = useRef(false);

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

  const handleOpen = useCallback(() => {
    if (dragBlockRef.current) return;
    if (onOpenCardDetails) {
      onOpenCardDetails(card);
    } else {
      setIsDialogOpen(true);
    }
  }, [card, onOpenCardDetails]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOpen();
      }
    },
    [handleOpen]
  );

  return {
    card,
    backCard,
    thumbnailPriority,
    isDialogOpen,
    setIsDialogOpen,
    isDragging,
    dragPreviewImageRef,
    dragHandleProps,
    handleOpen,
    handleKeyDown,
  };
}

export type CardListItemModel = ReturnType<typeof useCardListItemModel>;
