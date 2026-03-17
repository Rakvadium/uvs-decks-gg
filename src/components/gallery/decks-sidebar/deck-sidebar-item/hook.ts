import { useCallback, useMemo } from "react";
import { useDecksSidebarContext } from "../context";
import type { DeckData } from "../types";

export function useDeckSidebarItemModel(deck: DeckData) {
  const { activeDeckId, setActiveDeck, userId, cardIdMap } = useDecksSidebarContext();

  const isOwner = userId ? deck.userId === userId : false;
  const isActive = activeDeckId === deck._id;

  const mainCount = useMemo(() => Object.values(deck.mainQuantities).reduce((sum, qty) => sum + qty, 0), [deck.mainQuantities]);
  const sideCount = useMemo(() => Object.values(deck.sideQuantities).reduce((sum, qty) => sum + qty, 0), [deck.sideQuantities]);
  const referenceCount = useMemo(
    () => Object.values(deck.referenceQuantities).reduce((sum, qty) => sum + qty, 0),
    [deck.referenceQuantities]
  );
  const imageCardId = deck.imageCardId ?? deck.startingCharacterId;
  const imageCard = imageCardId ? cardIdMap.get(imageCardId) ?? null : null;
  const deckImageUrl = imageCard?.imageUrl ?? null;
  const deckImageName = imageCard?.name ?? deck.name;

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
    deckImageUrl,
    deckImageName,
    handleSetActive,
  };
}

export type DeckSidebarItemModel = ReturnType<typeof useDeckSidebarItemModel>;
