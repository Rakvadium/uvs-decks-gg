import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useDeckEditor } from "@/lib/deck";

export function useDeckSectionCounts() {
  return useDeckEditor().sectionCounts;
}

export function useCardDetailsDialogTrigger() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleKeyDownOpen = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsDialogOpen(true);
    }
  }, []);

  return {
    isDialogOpen,
    setIsDialogOpen,
    openDialog,
    handleKeyDownOpen,
  };
}

export function useDragClickGuard(isDragging: boolean) {
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

  const canOpenDialog = useCallback(() => !dragBlockRef.current, []);

  return { canOpenDialog };
}
