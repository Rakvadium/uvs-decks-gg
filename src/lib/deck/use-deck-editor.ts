"use client";

import { useCallback, useMemo } from "react";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useSiloedDeckOptional } from "./siloed-deck-context";

type Deck = Doc<"decks">;
type DeckSection = "main" | "side" | "reference";

type DeckUpdate = {
  name?: string;
  description?: string;
  isPublic?: boolean;
  imageCardId?: Id<"cards"> | null;
  startingCharacterId?: Id<"cards"> | null;
  selectedIdentity?: string | null;
};

interface DeckEditorContextValue {
  deck: Deck | null;
  deckId: string | null;
  isLoading: boolean;
  hasDeck: boolean;
  mainCounts: Record<string, number>;
  sideCounts: Record<string, number>;
  referenceCounts: Record<string, number>;
  allCounts: Record<string, number>;
  getCardCount: (cardId: string) => number;
  getCardSection: (cardId: string) => DeckSection | null;
  getTotalCardCount: () => number;
  getSectionCardCount: (section: DeckSection) => number;
  addCard: (cardId: Id<"cards">, section?: DeckSection, quantity?: number) => void;
  removeCard: (cardId: Id<"cards">, section?: DeckSection, quantity?: number) => void;
  moveCard: (cardId: Id<"cards">, fromSection: DeckSection, toSection: DeckSection, quantity?: number) => void;
  updateDeck: (updates: DeckUpdate) => void;
  mode: "active" | "siloed";
}

function repeat(times: number, action: () => void) {
  if (times <= 0) return;
  if (times === 1) {
    action();
    return;
  }
  for (let i = 0; i < times; i += 1) {
    action();
  }
}

export function useDeckEditor(): DeckEditorContextValue {
  const siloed = useSiloedDeckOptional();
  const active = useActiveDeck();

  const activeValue = useMemo<DeckEditorContextValue>(() => ({
    deck: active.activeDeck ?? null,
    deckId: active.activeDeckId ?? null,
    isLoading: active.isLoading,
    hasDeck: active.hasActiveDeck,
    mainCounts: active.mainCounts,
    sideCounts: active.sideCounts,
    referenceCounts: active.referenceCounts,
    allCounts: active.allCounts,
    getCardCount: active.getCardCount,
    getCardSection: active.getCardSection,
    getTotalCardCount: active.getTotalCardCount,
    getSectionCardCount: active.getSectionCardCount,
    addCard: active.addCard,
    removeCard: active.removeCard,
    moveCard: active.moveCard,
    updateDeck: active.updateDeck,
    mode: "active",
  }), [
    active.activeDeck,
    active.activeDeckId,
    active.isLoading,
    active.hasActiveDeck,
    active.mainCounts,
    active.sideCounts,
    active.referenceCounts,
    active.allCounts,
    active.getCardCount,
    active.getCardSection,
    active.getTotalCardCount,
    active.getSectionCardCount,
    active.addCard,
    active.removeCard,
    active.moveCard,
    active.updateDeck,
  ]);

  const getSiloedCardCount = useCallback(
    (cardId: string) => siloed?.allCounts[cardId] ?? 0,
    [siloed]
  );

  const addSiloedCard = useCallback(
    (cardId: Id<"cards">, section: DeckSection = "main", quantity?: number) => {
      if (!siloed) return;
      const times = quantity ?? 1;
      repeat(times, () => {
        void siloed.addCard(cardId, section);
      });
    },
    [siloed]
  );

  const removeSiloedCard = useCallback(
    (cardId: Id<"cards">, section?: DeckSection, quantity?: number) => {
      if (!siloed) return;
      const resolvedSection = section ?? siloed.getCardSection(cardId);
      if (!resolvedSection) return;
      const times = quantity ?? 1;
      repeat(times, () => {
        void siloed.removeCard(cardId, resolvedSection);
      });
    },
    [siloed]
  );

  const moveSiloedCard = useCallback(
    (cardId: Id<"cards">, fromSection: DeckSection, toSection: DeckSection, quantity?: number) => {
      if (!siloed) return;
      void siloed.moveCard(cardId, fromSection, toSection, quantity);
    },
    [siloed]
  );

  const updateSiloedDeck = useCallback(
    (updates: DeckUpdate) => {
      if (!siloed) return;
      void siloed.updateDeck(updates);
    },
    [siloed]
  );

  const siloedValue = useMemo<DeckEditorContextValue>(() => ({
    deck: siloed?.deck ?? null,
    deckId: siloed?.deckId ?? null,
    isLoading: siloed?.isLoading ?? false,
    hasDeck: !!siloed?.deck,
    mainCounts: siloed?.mainCounts ?? {},
    sideCounts: siloed?.sideCounts ?? {},
    referenceCounts: siloed?.referenceCounts ?? {},
    allCounts: siloed?.allCounts ?? {},
    getCardCount: getSiloedCardCount,
    getCardSection: (cardId: string) => siloed?.getCardSection(cardId as Id<"cards">) ?? null,
    getTotalCardCount: () => siloed?.getTotalCardCount() ?? 0,
    getSectionCardCount: (section: DeckSection) => siloed?.getSectionCardCount(section) ?? 0,
    addCard: addSiloedCard,
    removeCard: removeSiloedCard,
    moveCard: moveSiloedCard,
    updateDeck: updateSiloedDeck,
    mode: "siloed",
  }), [
    siloed,
    getSiloedCardCount,
    addSiloedCard,
    removeSiloedCard,
    moveSiloedCard,
    updateSiloedDeck,
  ]);

  return siloed ? siloedValue : activeValue;
}
