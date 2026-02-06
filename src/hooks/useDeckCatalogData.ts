"use client";

import { useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export type DeckTab = "my-decks" | "public" | "tournament";

export function useDeckCatalogData(searchQuery: string, activeTab: DeckTab) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");
  const deckSearch = searchQuery.trim();

  const myDecksAll = useQuery(api.decks.listByUser, user ? { userId: user._id } : "skip");
  const publicDecksAll = useQuery(api.decks.listPublic, {});

  const myDecks = useQuery(
    api.decks.listByUser,
    user
      ? {
          userId: user._id,
          ...(deckSearch ? { search: deckSearch } : {}),
        }
      : "skip"
  );

  const publicDecks = useQuery(api.decks.listPublic, deckSearch ? { search: deckSearch } : {});

  const deckCounts = useMemo(
    () => ({
      "my-decks": myDecksAll?.length ?? 0,
      public: publicDecksAll?.length ?? 0,
      tournament: 0,
    }),
    [myDecksAll?.length, publicDecksAll?.length]
  );

  const currentDecks: Doc<"decks">[] = useMemo(() => {
    if (activeTab === "my-decks") return myDecks ?? [];
    if (activeTab === "public") return publicDecks ?? [];
    return [];
  }, [activeTab, myDecks, publicDecks]);

  const isTabLoading =
    authLoading ||
    (activeTab === "my-decks" && isAuthenticated && myDecks === undefined) ||
    (activeTab === "public" && publicDecks === undefined);

  return {
    isAuthenticated,
    authLoading,
    user,
    deckSearch,
    myDecks,
    publicDecks,
    myDecksAll,
    publicDecksAll,
    deckCounts,
    currentDecks,
    isTabLoading,
  };
}
