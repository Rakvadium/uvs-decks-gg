"use client";

import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useSiloedDeckOptional } from "@/lib/deck";
import type { DeckVisibility } from "@/lib/deck/visibility";
import { normalizeDeckVisibility } from "@/lib/deck/visibility";
import { useActiveDeck } from "./ActiveDeckProvider";

type DeckSection = "main" | "side" | "reference";
type DeckDetailsUpdate = {
  name?: string;
  description?: string;
  visibility?: DeckVisibility;
  imageCardId?: Id<"cards"> | null;
  startingCharacterId?: Id<"cards"> | null;
  selectedIdentity?: string | null;
};

interface DeckDetailsContextValue {
  deckId: Id<"decks"> | null;
  deck: ReturnType<typeof useQuery<typeof api.decks.getById>> | undefined;
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  activeSection: DeckSection;
  setActiveSection: (section: DeckSection) => void;
  isEditing: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  editName: string;
  setEditName: (value: string) => void;
  editDescription: string;
  setEditDescription: (value: string) => void;
  editFormat: string;
  setEditFormat: (value: string) => void;
  editVisibility: DeckVisibility;
  setEditVisibility: (value: DeckVisibility) => void;
  isSaving: boolean;
  saveEdits: () => Promise<void>;
  updateDeck: (updates: DeckDetailsUpdate) => Promise<void>;
  isDeleting: boolean;
  deleteDeck: () => Promise<void>;
  isActiveDeck: boolean;
  setAsActiveDeck: () => void;
  selectedCardIds: string[];
  selectCard: (cardId: string) => void;
  deselectCard: (cardId: string) => void;
  clearSelection: () => void;
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
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFormat, setEditFormat] = useState("");
  const [editVisibility, setEditVisibility] = useState<DeckVisibility>("private");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const { activeDeckId, setActiveDeck } = useActiveDeck();
  const siloedDeck = useSiloedDeckOptional();
  const typedDeckId = deckId as Id<"decks">;
  const currentUser = useQuery(api.user.currentUser);
  const queriedDeck = useQuery(api.decks.getById, siloedDeck ? "skip" : { deckId: typedDeckId });
  const deck = siloedDeck?.deck ?? queriedDeck;
  const isDeckLoading = siloedDeck ? siloedDeck.isLoading : queriedDeck === undefined;
  const isOwner = Boolean(deck && currentUser && deck.userId === currentUser._id);
  const isAdmin = currentUser?.role === "Admin";
  const updateDeckMutation = useMutation(api.decks.update);
  const deleteDeckMutation = useMutation(api.decks.deleteDeck);

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
    if (deck && isOwner) {
      setActiveDeck(deck._id);
    }
  }, [deck, isOwner, setActiveDeck]);

  const isActiveDeck = !!(deck && activeDeckId === deck._id);

  const startEditing = useCallback(() => {
    if (!deck) return;
    setEditName(deck.name);
    setEditDescription(deck.description || "");
    setEditFormat(deck.format || "");
    setEditVisibility(normalizeDeckVisibility(deck));
    setIsEditing(true);
  }, [deck]);

  const cancelEditing = useCallback(() => {
    if (deck) {
      setEditName(deck.name);
      setEditDescription(deck.description || "");
      setEditFormat(deck.format || "");
      setEditVisibility(normalizeDeckVisibility(deck));
    }
    setIsEditing(false);
  }, [deck]);

  const saveEdits = useCallback(async () => {
    if (!deck) return;
    setIsSaving(true);
    try {
      const updates: DeckDetailsUpdate = {
        name: editName.trim() || deck.name,
        description: editDescription.trim() || undefined,
        visibility: editVisibility,
      };
      if (siloedDeck) {
        await siloedDeck.updateDeck(updates);
      } else {
        await updateDeckMutation({
          deckId: deck._id,
          ...updates,
        });
      }
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [deck, editName, editDescription, editVisibility, siloedDeck, updateDeckMutation]);

  const updateDeckDetails = useCallback(async (updates: DeckDetailsUpdate) => {
    if (!deck) return;
    if (siloedDeck) {
      await siloedDeck.updateDeck(updates);
      return;
    }
    await updateDeckMutation({
      deckId: deck._id,
      ...updates,
    });
  }, [deck, siloedDeck, updateDeckMutation]);

  const deleteDeckAndExit = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteDeckMutation({ deckId: typedDeckId });
      router.push("/decks");
    } catch {
      setIsDeleting(false);
    }
  }, [deleteDeckMutation, typedDeckId, router]);

  useEffect(() => {
    if (!deck || isEditing) return;
    setEditName(deck.name);
    setEditDescription(deck.description || "");
    setEditFormat(deck.format || "");
    setEditVisibility(normalizeDeckVisibility(deck));
  }, [deck, isEditing]);

  const value = useMemo((): DeckDetailsContextValue => ({
    deckId: typedDeckId,
    deck,
    isLoading: isDeckLoading,
    isOwner,
    isAdmin,
    activeSection,
    setActiveSection,
    isEditing,
    startEditing,
    cancelEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editFormat,
    setEditFormat,
    editVisibility,
    setEditVisibility,
    isSaving,
    saveEdits,
    updateDeck: updateDeckDetails,
    isDeleting,
    deleteDeck: deleteDeckAndExit,
    isActiveDeck,
    setAsActiveDeck,
    selectedCardIds,
    selectCard,
    deselectCard,
    clearSelection,
  }), [
    typedDeckId,
    deck,
    isDeckLoading,
    isOwner,
    isAdmin,
    activeSection,
    isEditing,
    startEditing,
    cancelEditing,
    editName,
    editDescription,
    editFormat,
    editVisibility,
    isSaving,
    saveEdits,
    updateDeckDetails,
    isDeleting,
    deleteDeckAndExit,
    isActiveDeck,
    setAsActiveDeck,
    selectedCardIds,
    selectCard,
    deselectCard,
    clearSelection,
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
