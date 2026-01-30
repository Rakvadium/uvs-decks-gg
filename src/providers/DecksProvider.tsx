"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";

type DeckTab = "my-decks" | "public" | "tournament";

interface DecksState {
  activeTab: DeckTab;
  searchQuery: string;
  isCreateDialogOpen: boolean;
}

interface DecksActions {
  setActiveTab: (tab: DeckTab) => void;
  setSearchQuery: (query: string) => void;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
}

interface DecksContextValue {
  state: DecksState;
  actions: DecksActions;
}

const DecksContext = createContext<DecksContextValue | null>(null);

export function DecksProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<DeckTab>("my-decks");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const value = useMemo((): DecksContextValue => ({
    state: {
      activeTab,
      searchQuery,
      isCreateDialogOpen,
    },
    actions: {
      setActiveTab,
      setSearchQuery,
      openCreateDialog: () => setIsCreateDialogOpen(true),
      closeCreateDialog: () => setIsCreateDialogOpen(false),
    },
  }), [activeTab, searchQuery, isCreateDialogOpen]);

  return (
    <DecksContext.Provider value={value}>
      {children}
    </DecksContext.Provider>
  );
}

export function useDecks(): DecksContextValue {
  const context = useContext(DecksContext);
  if (!context) {
    throw new Error("useDecks must be used within DecksProvider");
  }
  return context;
}

export function useDecksOptional(): DecksContextValue | null {
  return useContext(DecksContext);
}
