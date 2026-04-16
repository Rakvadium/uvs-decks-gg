"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { useCardIndex } from "@/lib/universus/card-data-provider";
import { canAddCardToSection, canMoveCardToSection } from "./card-eligibility";

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

interface SiloedDeckContextValue {
  deck: Deck | null;
  deckId: string;
  isLoading: boolean;
  mainCounts: Record<string, number>;
  sideCounts: Record<string, number>;
  referenceCounts: Record<string, number>;
  allCounts: Record<string, number>;
  addCard: (cardId: Id<"cards">, section?: DeckSection) => Promise<void>;
  removeCard: (cardId: Id<"cards">, section: DeckSection) => Promise<void>;
  moveCard: (cardId: Id<"cards">, fromSection: DeckSection, toSection: DeckSection, quantity?: number) => Promise<void>;
  updateDeck: (updates: DeckUpdate) => Promise<void>;
  getCardSection: (cardId: Id<"cards">) => DeckSection | null;
  getTotalCardCount: () => number;
  getSectionCardCount: (section: DeckSection) => number;
}

const SiloedDeckContext = createContext<SiloedDeckContextValue | null>(null);

interface SiloedDeckProviderProps {
  children: ReactNode;
  deckId: string;
}

export function SiloedDeckProvider({ children, deckId }: SiloedDeckProviderProps) {
  const deckData = useQuery(
    api.decks.getById,
    { deckId: deckId as Id<"decks"> }
  );
  const cardIndex = useCardIndex();

  const addCardMutation = useMutation(api.decks.addCard);
  const removeCardMutation = useMutation(api.decks.removeCard);
  const moveCardMutation = useMutation(api.decks.moveCard);
  const updateDeckMutation = useMutation(api.decks.update);

  const deck = (deckData as Deck | null | undefined) ?? null;
  const isLoading = deckData === undefined;

  const mainCounts = useMemo(() => deck?.mainQuantities ?? {}, [deck?.mainQuantities]);
  const sideCounts = useMemo(() => deck?.sideQuantities ?? {}, [deck?.sideQuantities]);
  const referenceCounts = useMemo(() => deck?.referenceQuantities ?? {}, [deck?.referenceQuantities]);

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

  const sectionCounts = useMemo(
    () => ({ mainCounts, sideCounts, referenceCounts }),
    [mainCounts, sideCounts, referenceCounts]
  );

  const canAddToSection = useCallback(
    (cardId: Id<"cards">, section: DeckSection, quantity?: number) => {
      const card = cardIndex?.byId.get(cardId.toString());
      return canAddCardToSection({
        card,
        cardId: cardId.toString(),
        section,
        counts: sectionCounts,
        quantity,
      });
    },
    [cardIndex, sectionCounts]
  );

  const canMoveToSection = useCallback(
    (cardId: Id<"cards">, fromSection: DeckSection, toSection: DeckSection, quantity?: number) => {
      const card = cardIndex?.byId.get(cardId.toString());
      return canMoveCardToSection({
        card,
        cardId: cardId.toString(),
        fromSection,
        toSection,
        counts: sectionCounts,
        quantity,
      });
    },
    [cardIndex, sectionCounts]
  );

  const addCard = useCallback(
    async (cardId: Id<"cards">, section: DeckSection = "main") => {
      if (!canAddToSection(cardId, section)) return;
      await addCardMutation({
        deckId: deckId as Id<"decks">,
        cardId,
        section,
      });
    },
    [deckId, addCardMutation, canAddToSection]
  );

  const removeCard = useCallback(
    async (cardId: Id<"cards">, section: DeckSection) => {
      await removeCardMutation({
        deckId: deckId as Id<"decks">,
        cardId,
        section,
      });
    },
    [deckId, removeCardMutation]
  );

  const moveCard = useCallback(
    async (cardId: Id<"cards">, fromSection: DeckSection, toSection: DeckSection, quantity?: number) => {
      if (!canMoveToSection(cardId, fromSection, toSection, quantity)) return;
      await moveCardMutation({
        deckId: deckId as Id<"decks">,
        cardId,
        fromSection,
        toSection,
        quantity,
      });
    },
    [deckId, moveCardMutation, canMoveToSection]
  );

  const updateDeck = useCallback(
    async (updates: DeckUpdate) => {
      await updateDeckMutation({
        deckId: deckId as Id<"decks">,
        ...updates,
      });
    },
    [deckId, updateDeckMutation]
  );

  const getCardSection = useCallback(
    (cardId: Id<"cards">): DeckSection | null => {
      const cardIdStr = cardId.toString();
      if (mainCounts[cardIdStr]) return "main";
      if (sideCounts[cardIdStr]) return "side";
      if (referenceCounts[cardIdStr]) return "reference";
      return null;
    },
    [mainCounts, sideCounts, referenceCounts]
  );

  const getTotalCardCount = useCallback(() => {
    let total = 0;
    for (const count of Object.values(mainCounts)) total += count;
    for (const count of Object.values(sideCounts)) total += count;
    for (const count of Object.values(referenceCounts)) total += count;
    return total;
  }, [mainCounts, sideCounts, referenceCounts]);

  const getSectionCardCount = useCallback(
    (section: DeckSection) => {
      const counts = section === "main" ? mainCounts : section === "side" ? sideCounts : referenceCounts;
      let total = 0;
      for (const count of Object.values(counts)) total += count;
      return total;
    },
    [mainCounts, sideCounts, referenceCounts]
  );

  const value = useMemo(
    () => ({
      deck,
      deckId,
      isLoading,
      mainCounts,
      sideCounts,
      referenceCounts,
      allCounts,
      addCard,
      removeCard,
      moveCard,
      updateDeck,
      getCardSection,
      getTotalCardCount,
      getSectionCardCount,
    }),
    [
      deck,
      deckId,
      isLoading,
      mainCounts,
      sideCounts,
      referenceCounts,
      allCounts,
      addCard,
      removeCard,
      moveCard,
      updateDeck,
      getCardSection,
      getTotalCardCount,
      getSectionCardCount,
    ]
  );

  return (
    <SiloedDeckContext.Provider value={value}>
      {children}
    </SiloedDeckContext.Provider>
  );
}

export function useSiloedDeck() {
  const context = useContext(SiloedDeckContext);
  if (!context) {
    throw new Error("useSiloedDeck must be used within a SiloedDeckProvider");
  }
  return context;
}

export function useSiloedDeckOptional() {
  return useContext(SiloedDeckContext);
}
