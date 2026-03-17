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

type Deck = Doc<"decks">;

interface ActiveDeckContextValue {
  activeDeck: Deck | null | undefined;
  activeDeckId: string | undefined;
  isLoading: boolean;
  hasActiveDeck: boolean;
  getCardCount: (cardId: string) => number;
  addCard: (cardId: string) => void;
  removeCard: (cardId: string) => void;
  setActiveDeck: (deckId: Id<"decks"> | undefined) => void;
}

const ActiveDeckContext = createContext<ActiveDeckContextValue>({
  activeDeck: null,
  activeDeckId: undefined,
  isLoading: false,
  hasActiveDeck: false,
  getCardCount: () => 0,
  addCard: () => {},
  removeCard: () => {},
  setActiveDeck: () => {},
});

interface ActiveDeckProviderProps {
  children: ReactNode;
}

export function ActiveDeckProvider({ children }: ActiveDeckProviderProps) {
  const { uiState, setActiveDeckId } = useUIState();
  const activeDeckId = uiState.activeDeckId;

  const activeDeck = useQuery(
    api.decks.getById,
    activeDeckId ? { deckId: activeDeckId as Id<"decks"> } : "skip"
  );

  const addCardMutation = useMutation(api.decks.addCard);
  const removeCardMutation = useMutation(api.decks.removeCard);

  const isLoading = activeDeckId !== undefined && activeDeck === undefined;
  const hasActiveDeck = !!activeDeck;

  const getCardCount = useCallback(
    (cardId: string): number => {
      if (!activeDeck) return 0;
      const mainCount = activeDeck.mainQuantities[cardId] ?? 0;
      const sideCount = activeDeck.sideQuantities[cardId] ?? 0;
      return mainCount + sideCount;
    },
    [activeDeck]
  );

  const addCard = useCallback(
    (cardId: string) => {
      if (!activeDeckId) return;
      addCardMutation({
        deckId: activeDeckId as Id<"decks">,
        cardId: cardId as Id<"cards">,
        section: "main",
      });
    },
    [activeDeckId, addCardMutation]
  );

  const removeCard = useCallback(
    (cardId: string) => {
      if (!activeDeckId) return;
      removeCardMutation({
        deckId: activeDeckId as Id<"decks">,
        cardId: cardId as Id<"cards">,
        section: "main",
      });
    },
    [activeDeckId, removeCardMutation]
  );

  const setActiveDeck = useCallback(
    (deckId: Id<"decks"> | undefined) => {
      setActiveDeckId(deckId ?? undefined);
    },
    [setActiveDeckId]
  );

  const value = useMemo(
    (): ActiveDeckContextValue => ({
      activeDeck,
      activeDeckId,
      isLoading,
      hasActiveDeck,
      getCardCount,
      addCard,
      removeCard,
      setActiveDeck,
    }),
    [activeDeck, activeDeckId, isLoading, hasActiveDeck, getCardCount, addCard, removeCard, setActiveDeck]
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
