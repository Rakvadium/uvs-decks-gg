import { useMemo } from "react";
import { useCardData } from "@/lib/universus/card-data-provider";
import type { DeckGridItemProps } from "./types";

function countSectionCards(quantities: Record<string, number>) {
  return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
}

export function useDeckGridItemModel({ deck, showAuthor = false, coverImagePriority = false }: DeckGridItemProps) {
  const { cards } = useCardData();

  const imageCard = useMemo(() => {
    if (!deck.imageCardId) return null;
    return cards.find((card) => card._id === deck.imageCardId) ?? null;
  }, [deck.imageCardId, cards]);

  const startingCharacter = useMemo(() => {
    if (!deck.startingCharacterId) return null;
    return cards.find((card) => card._id === deck.startingCharacterId) ?? null;
  }, [deck.startingCharacterId, cards]);

  const counts = useMemo(
    () => ({
      main: countSectionCards(deck.mainQuantities),
      side: countSectionCards(deck.sideQuantities),
      reference: countSectionCards(deck.referenceQuantities),
    }),
    [deck.mainQuantities, deck.sideQuantities, deck.referenceQuantities]
  );

  return {
    deck,
    showAuthor,
    coverImagePriority,
    displayImage: imageCard?.imageUrl || startingCharacter?.imageUrl,
    startingCharacterName: startingCharacter?.name,
    counts,
    isReady: counts.main >= 60,
  };
}

export type DeckGridItemModel = ReturnType<typeof useDeckGridItemModel>;
