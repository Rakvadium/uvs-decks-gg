import { useMemo } from "react";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
import { useGameModule } from "@/games/game-context";
import type { CachedCard } from "@/lib/universus/card-store";

export function useCardMainDeckControls(card: CachedCard) {
  const {
    hasDeck,
    getCardCount,
    addCard,
    removeCard,
    mainCounts,
    sideCounts,
    referenceCounts,
  } = useDeckEditor();
  const gameDeck = useGameModule().deck;

  const sectionCounts = useMemo(
    () => ({ mainCounts, sideCounts, referenceCounts }),
    [mainCounts, sideCounts, referenceCounts]
  );

  const deckCount = getCardCount(card._id);
  const canAddToDeck = canAddCardToSection({
    card,
    cardId: card._id,
    section: "main",
    counts: sectionCounts,
    rules: gameDeck,
  });

  return {
    hasDeck,
    deckCount,
    canAddToDeck,
    addToDeck: () => addCard(card._id),
    removeFromDeck: () => removeCard(card._id),
  };
}
