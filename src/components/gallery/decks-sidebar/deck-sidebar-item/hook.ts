import { useCallback } from "react";
import { useDecksSidebarContext } from "../context";
import type { DeckData } from "../types";

export function useDeckSidebarItemModel(deck: DeckData) {
  const { activeDeckId, activeTab, setActiveDeck, userId } = useDecksSidebarContext();

  const isOwner = userId ? deck.userId === userId : false;
  const isActive = activeDeckId === deck._id;
  const showAuthor = activeTab === "public" || activeTab === "tournament";

  const handleSetActive = useCallback(() => {
    if (!isActive) {
      setActiveDeck(deck._id);
    }
  }, [deck._id, isActive, setActiveDeck]);

  return {
    deck,
    isOwner,
    isActive,
    showAuthor,
    handleSetActive,
  };
}

export type DeckSidebarItemModel = ReturnType<typeof useDeckSidebarItemModel>;
