"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { useDeckCatalogData, type DeckTab } from "@/hooks/useDeckCatalogData";

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
  catalog: ReturnType<typeof useDeckCatalogData>;
}

const DecksContext = createContext<DecksContextValue | null>(null);

export function DecksProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<DeckTab>("my-decks");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const catalog = useDeckCatalogData(searchQuery, activeTab);

  const value = useMemo(
    (): DecksContextValue => ({
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
      catalog,
    }),
    [activeTab, searchQuery, isCreateDialogOpen, catalog]
  );

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
