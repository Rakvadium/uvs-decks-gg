import { useCallback, useMemo, useState, createContext, useContext, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useDeckCatalogData, type DeckTab } from "@/hooks/useDeckCatalogData";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";

interface DecksSidebarContextValue {
  activeTab: DeckTab;
  searchQuery: string;
  isCreateOpen: boolean;
  newDeckName: string;
  isCreating: boolean;
  setActiveTab: (tab: DeckTab) => void;
  setSearchQuery: (value: string) => void;
  setIsCreateOpen: (open: boolean) => void;
  setNewDeckName: (value: string) => void;
  handleCreate: () => Promise<void>;
  isAuthenticated: boolean;
  userId: string | null;
  deckCounts: ReturnType<typeof useDeckCatalogData>["deckCounts"];
  currentDecks: ReturnType<typeof useDeckCatalogData>["currentDecks"];
  isTabLoading: boolean;
  activeDeckId: string | null | undefined;
  setActiveDeck: (deckId: string | null) => void;
  cardIdMap: ReturnType<typeof useCardIdMap>;
}

const DecksSidebarContext = createContext<DecksSidebarContextValue | null>(null);

interface DecksSidebarProviderProps {
  children: ReactNode;
}

export function DecksSidebarProvider({ children }: DecksSidebarProviderProps) {
  const [activeTab, setActiveTab] = useState<DeckTab>("my-decks");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { isAuthenticated, user, deckCounts, currentDecks, isTabLoading } = useDeckCatalogData(
    searchQuery,
    activeTab
  );

  const createDeck = useMutation(api.decks.create);
  const { activeDeckId, setActiveDeck } = useActiveDeck();
  const { cards } = useCardData();
  const cardIdMap = useCardIdMap(cards);

  const handleCreate = useCallback(async () => {
    const trimmedName = newDeckName.trim();
    if (!trimmedName) return;

    setIsCreating(true);
    try {
      const newDeckId = await createDeck({ name: trimmedName });
      setActiveDeck(newDeckId);
      setNewDeckName("");
      setIsCreateOpen(false);
    } finally {
      setIsCreating(false);
    }
  }, [createDeck, newDeckName, setActiveDeck]);

  const value = useMemo(
    () => ({
      activeTab,
      searchQuery,
      isCreateOpen,
      newDeckName,
      isCreating,
      setActiveTab,
      setSearchQuery,
      setIsCreateOpen,
      setNewDeckName,
      handleCreate,
      isAuthenticated,
      userId: user?._id ?? null,
      deckCounts,
      currentDecks,
      isTabLoading,
      activeDeckId,
      setActiveDeck,
      cardIdMap,
    }),
    [
      activeTab,
      searchQuery,
      isCreateOpen,
      newDeckName,
      isCreating,
      handleCreate,
      isAuthenticated,
      user?._id,
      deckCounts,
      currentDecks,
      isTabLoading,
      activeDeckId,
      setActiveDeck,
      cardIdMap,
    ]
  );

  return <DecksSidebarContext.Provider value={value}>{children}</DecksSidebarContext.Provider>;
}

export function useDecksSidebarContext() {
  const context = useContext(DecksSidebarContext);
  if (!context) {
    throw new Error("useDecksSidebarContext must be used within DecksSidebarProvider");
  }
  return context;
}
