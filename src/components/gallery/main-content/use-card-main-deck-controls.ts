import { useMemo } from "react";
import { canAddCardToSection, useDeckEditor } from "@/lib/deck";
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
  });

  return {
    hasDeck,
    deckCount,
    canAddToDeck,
    addToDeck: () => addCard(card._id),
    removeFromDeck: () => removeCard(card._id),
  };
}
