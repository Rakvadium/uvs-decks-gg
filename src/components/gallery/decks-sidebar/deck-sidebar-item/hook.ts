import { useCallback, useMemo } from "react";
import { useDecksSidebarContext } from "../context";
import type { DeckData } from "../types";

export function useDeckSidebarItemModel(deck: DeckData) {
  const { activeDeckId, setActiveDeck, userId } = useDecksSidebarContext();

  const isOwner = userId ? deck.userId === userId : false;
  const isActive = activeDeckId === deck._id;

  const mainCount = useMemo(() => Object.values(deck.mainQuantities).reduce((sum, qty) => sum + qty, 0), [deck.mainQuantities]);
  const sideCount = useMemo(() => Object.values(deck.sideQuantities).reduce((sum, qty) => sum + qty, 0), [deck.sideQuantities]);
  const referenceCount = useMemo(
    () => Object.values(deck.referenceQuantities).reduce((sum, qty) => sum + qty, 0),
    [deck.referenceQuantities]
  );

  const handleSetActive = useCallback(() => {
    if (!isActive) {
      setActiveDeck(deck._id);
    }
  }, [deck._id, isActive, setActiveDeck]);

  return {
    deck,
    isOwner,
    isActive,
    mainCount,
    sideCount,
    referenceCount,
    handleSetActive,
  };
}

export type DeckSidebarItemModel = ReturnType<typeof useDeckSidebarItemModel>;
