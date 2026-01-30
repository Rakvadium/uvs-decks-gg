"use client";

import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useActiveDeck } from "./ActiveDeckProvider";

type DeckSection = "main" | "side" | "reference";

interface DeckDetailsState {
  deckId: Id<"decks"> | null;
  activeSection: DeckSection;
  isEditing: boolean;
  selectedCardIds: string[];
}

interface DeckDetailsActions {
  setActiveSection: (section: DeckSection) => void;
  setIsEditing: (editing: boolean) => void;
  selectCard: (cardId: string) => void;
  deselectCard: (cardId: string) => void;
  clearSelection: () => void;
  setAsActiveDeck: () => void;
}

interface DeckDetailsContextValue {
  state: DeckDetailsState;
  actions: DeckDetailsActions;
  deck: ReturnType<typeof useQuery<typeof api.decks.getById>> | undefined;
  mainCards: ReturnType<typeof useQuery<typeof api.cards.getByIds>> | undefined;
  sideCards: ReturnType<typeof useQuery<typeof api.cards.getByIds>> | undefined;
  referenceCards: ReturnType<typeof useQuery<typeof api.cards.getByIds>> | undefined;
  isLoading: boolean;
}

const DeckDetailsContext = createContext<DeckDetailsContextValue | null>(null);

interface DeckDetailsProviderProps {
  children: ReactNode;
  deckId: string;
}

export function DeckDetailsProvider({ children, deckId }: DeckDetailsProviderProps) {
  const [activeSection, setActiveSection] = useState<DeckSection>("main");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  
  const { setActiveDeck } = useActiveDeck();
  
  const typedDeckId = deckId as Id<"decks">;
  const deck = useQuery(api.decks.getById, { deckId: typedDeckId });
  
  const mainCards = useQuery(
    api.cards.getByIds,
    deck?.mainCardIds && deck.mainCardIds.length > 0 
      ? { cardIds: deck.mainCardIds } 
      : "skip"
  );
  
  const sideCards = useQuery(
    api.cards.getByIds,
    deck?.sideCardIds && deck.sideCardIds.length > 0 
      ? { cardIds: deck.sideCardIds } 
      : "skip"
  );
  
  const referenceCards = useQuery(
    api.cards.getByIds,
    deck?.referenceCardIds && deck.referenceCardIds.length > 0 
      ? { cardIds: deck.referenceCardIds } 
      : "skip"
  );

  const selectCard = useCallback((cardId: string) => {
    setSelectedCardIds(prev => prev.includes(cardId) ? prev : [...prev, cardId]);
  }, []);

  const deselectCard = useCallback((cardId: string) => {
    setSelectedCardIds(prev => prev.filter(id => id !== cardId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCardIds([]);
  }, []);

  const setAsActiveDeck = useCallback(() => {
    if (deck) {
      setActiveDeck(deck._id);
    }
  }, [deck, setActiveDeck]);

  const value = useMemo((): DeckDetailsContextValue => ({
    state: {
      deckId: typedDeckId,
      activeSection,
      isEditing,
      selectedCardIds,
    },
    actions: {
      setActiveSection,
      setIsEditing,
      selectCard,
      deselectCard,
      clearSelection,
      setAsActiveDeck,
    },
    deck,
    mainCards,
    sideCards,
    referenceCards,
    isLoading: deck === undefined,
  }), [
    typedDeckId,
    activeSection,
    isEditing,
    selectedCardIds,
    deck,
    mainCards,
    sideCards,
    referenceCards,
    selectCard,
    deselectCard,
    clearSelection,
    setAsActiveDeck,
  ]);

  return (
    <DeckDetailsContext.Provider value={value}>
      {children}
    </DeckDetailsContext.Provider>
  );
}

export function useDeckDetails(): DeckDetailsContextValue {
  const context = useContext(DeckDetailsContext);
  if (!context) {
    throw new Error("useDeckDetails must be used within DeckDetailsProvider");
  }
  return context;
}

export function useDeckDetailsOptional(): DeckDetailsContextValue | null {
  return useContext(DeckDetailsContext);
}
