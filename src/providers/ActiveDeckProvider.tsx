"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useUIState } from "./UIStateProvider";
import { useCardData } from "@/lib/universus";
import { canAddCardToSection, canMoveCardToSection } from "@/lib/deck";

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

interface ActiveDeckContextValue {
  activeDeck: Deck | null | undefined;
  activeDeckId: string | null | undefined;
  isLoading: boolean;
  hasActiveDeck: boolean;
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
  setActiveDeck: (deckId: string | null) => void;
}

const ActiveDeckContext = createContext<ActiveDeckContextValue>({
  activeDeck: null,
  activeDeckId: null,
  isLoading: false,
  hasActiveDeck: false,
  mainCounts: {},
  sideCounts: {},
  referenceCounts: {},
  allCounts: {},
  getCardCount: () => 0,
  getCardSection: () => null,
  getTotalCardCount: () => 0,
  getSectionCardCount: () => 0,
  addCard: () => {},
  removeCard: () => {},
  moveCard: () => {},
  updateDeck: () => {},
  setActiveDeck: () => {},
});

interface ActiveDeckProviderProps {
  children: ReactNode;
}

export function ActiveDeckProvider({ children }: ActiveDeckProviderProps) {
  const { uiState, setActiveDeckId: setActiveDeckIdInUI } = useUIState();
  const activeDeckId = uiState.activeDeckId;
  const { cards } = useCardData();

  const activeDeck = useQuery(
    api.decks.getById,
    activeDeckId ? { deckId: activeDeckId as Id<"decks"> } : "skip"
  );

  const addCardMutation = useMutation(api.decks.addCard);
  const removeCardMutation = useMutation(api.decks.removeCard);
  const moveCardMutation = useMutation(api.decks.moveCard);
  const updateDeckMutation = useMutation(api.decks.update);

  const isLoading = activeDeckId !== undefined && activeDeck === undefined;
  const hasActiveDeck = !!activeDeck;

  const mainCounts = useMemo(() => activeDeck?.mainQuantities ?? {}, [activeDeck?.mainQuantities]);
  const sideCounts = useMemo(() => activeDeck?.sideQuantities ?? {}, [activeDeck?.sideQuantities]);
  const referenceCounts = useMemo(() => activeDeck?.referenceQuantities ?? {}, [activeDeck?.referenceQuantities]);

  const allCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [cardId, count] of Object.entries(mainCounts)) {
      counts[cardId] = (counts[cardId] ?? 0) + count;
    }
    for (const [cardId, count] of Object.entries(sideCounts)) {
      counts[cardId] = (counts[cardId] ?? 0) + count;
    }
    for (const [cardId, count] of Object.entries(referenceCounts)) {
      counts[cardId] = (counts[cardId] ?? 0) + count;
    }
    return counts;
  }, [mainCounts, sideCounts, referenceCounts]);

  const cardMap = useMemo(() => {
    const map = new Map<string, Doc<"cards">>();
    for (const card of cards) {
      map.set(card._id, card as Doc<"cards">);
    }
    return map;
  }, [cards]);

  const sectionCounts = useMemo(
    () => ({ mainCounts, sideCounts, referenceCounts }),
    [mainCounts, sideCounts, referenceCounts]
  );

  const canAddToSection = useCallback(
    (cardId: Id<"cards">, section: DeckSection, quantity?: number) => {
      const card = cardMap.get(cardId.toString());
      return canAddCardToSection({
        card,
        cardId: cardId.toString(),
        section,
        counts: sectionCounts,
        quantity,
      });
    },
    [cardMap, sectionCounts]
  );

  const canMoveToSection = useCallback(
    (cardId: Id<"cards">, fromSection: DeckSection, toSection: DeckSection, quantity?: number) => {
      const card = cardMap.get(cardId.toString());
      return canMoveCardToSection({
        card,
        cardId: cardId.toString(),
        fromSection,
        toSection,
        counts: sectionCounts,
        quantity,
      });
    },
    [cardMap, sectionCounts]
  );

  const setActiveDeck = useCallback(
    (deckId: string | null) => {
      setActiveDeckIdInUI(deckId ?? undefined);
    },
    [setActiveDeckIdInUI]
  );

  const getCardCount = useCallback(
    (cardId: string): number => {
      if (!activeDeck) return 0;
      return allCounts[cardId] ?? 0;
    },
    [activeDeck, allCounts]
  );

  const getCardSection = useCallback(
    (cardId: string): DeckSection | null => {
      if (mainCounts[cardId]) return "main";
      if (sideCounts[cardId]) return "side";
      if (referenceCounts[cardId]) return "reference";
      return null;
    },
    [mainCounts, sideCounts, referenceCounts]
  );

  const getTotalCardCount = useCallback(() => {
    let total = 0;
    for (const count of Object.values(allCounts)) total += count;
    return total;
  }, [allCounts]);

  const getSectionCardCount = useCallback(
    (section: DeckSection) => {
      const counts = section === "main" ? mainCounts : section === "side" ? sideCounts : referenceCounts;
      let total = 0;
      for (const count of Object.values(counts)) total += count;
      return total;
    },
    [mainCounts, sideCounts, referenceCounts]
  );

  const addCard = useCallback(
    (cardId: Id<"cards">, section: DeckSection = "main", quantity?: number) => {
      if (!activeDeckId) return;
      if (!canAddToSection(cardId, section, quantity)) return;
      addCardMutation({
        deckId: activeDeckId as Id<"decks">,
        cardId,
        section,
        quantity,
      });
    },
    [activeDeckId, addCardMutation, canAddToSection]
  );

  const removeCard = useCallback(
    (cardId: Id<"cards">, section?: DeckSection, quantity?: number) => {
      if (!activeDeckId) return;
      const resolvedSection = section ?? getCardSection(cardId.toString());
      if (!resolvedSection) return;
      removeCardMutation({
        deckId: activeDeckId as Id<"decks">,
        cardId,
        section: resolvedSection,
        quantity,
      });
    },
    [activeDeckId, removeCardMutation, getCardSection]
  );

  const moveCard = useCallback(
    (cardId: Id<"cards">, fromSection: DeckSection, toSection: DeckSection, quantity?: number) => {
      if (!activeDeckId) return;
      if (!canMoveToSection(cardId, fromSection, toSection, quantity)) return;
      moveCardMutation({
        deckId: activeDeckId as Id<"decks">,
        cardId,
        fromSection,
        toSection,
        quantity,
      });
    },
    [activeDeckId, moveCardMutation, canMoveToSection]
  );

  const updateDeck = useCallback(
    (updates: DeckUpdate) => {
      if (!activeDeckId) return;
      updateDeckMutation({
        deckId: activeDeckId as Id<"decks">,
        ...updates,
      });
    },
    [activeDeckId, updateDeckMutation]
  );

  const value = useMemo(
    (): ActiveDeckContextValue => ({
      activeDeck,
      activeDeckId,
      isLoading,
      hasActiveDeck,
      mainCounts,
      sideCounts,
      referenceCounts,
      allCounts,
      getCardCount,
      getCardSection,
      getTotalCardCount,
      getSectionCardCount,
      addCard,
      removeCard,
      moveCard,
      updateDeck,
      setActiveDeck,
    }),
    [
      activeDeck,
      activeDeckId,
      isLoading,
      hasActiveDeck,
      mainCounts,
      sideCounts,
      referenceCounts,
      allCounts,
      getCardCount,
      getCardSection,
      getTotalCardCount,
      getSectionCardCount,
      addCard,
      removeCard,
      moveCard,
      updateDeck,
      setActiveDeck,
    ]
  );

  return (
    <ActiveDeckContext.Provider value={value}>
      {children}
    </ActiveDeckContext.Provider>
  );
}

export function useActiveDeck() {
  return useContext(ActiveDeckContext);
}
