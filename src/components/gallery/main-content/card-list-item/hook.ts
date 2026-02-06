import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTcgDraggable } from "@/lib/dnd";
import { useGalleryCardMap } from "../card-map-context";
import type { CardListItemProps } from "./types";

export function useCardListItemModel({ card }: CardListItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getBackCard } = useGalleryCardMap();
  const backCard = getBackCard(card);

  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: "gallery-list",
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
    setIsDialogOpen(true);
  }, []);

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
    isDialogOpen,
    setIsDialogOpen,
    isDragging,
    dragHandleProps,
    handleOpen,
    handleKeyDown,
  };
}

export type CardListItemModel = ReturnType<typeof useCardListItemModel>;
