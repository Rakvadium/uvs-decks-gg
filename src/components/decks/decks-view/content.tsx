import { useMemo } from "react";
import { useDecks } from "@/providers/DecksProvider";
import {
  DecksAuthRequiredState,
  DecksCountFooter,
  DecksEmptyState,
  DecksGrid,
  DecksLoadingState,
  DecksTournamentState,
} from "./content-states";

function getEmptyMode(searchQuery: string, activeTab: "my-decks" | "public" | "tournament") {
  if (searchQuery.trim()) return "search";
  if (activeTab === "my-decks") return "my-decks";
  return "public";
}

export function DecksViewContent() {
  const { state, actions, catalog } = useDecks();
  const { isAuthenticated, isTabLoading, currentDecks } = catalog;

  const emptyMode = useMemo(
    () => getEmptyMode(state.searchQuery, state.activeTab),
    [state.searchQuery, state.activeTab]
  );

  if (isTabLoading) {
    return <DecksLoadingState />;
  }

  if (!isAuthenticated && state.activeTab === "my-decks") {
    return <DecksAuthRequiredState />;
  }

  if (state.activeTab === "tournament") {
    return <DecksTournamentState />;
  }

  if (currentDecks.length === 0) {
    return <DecksEmptyState mode={emptyMode} onCreateDeck={actions.openCreateDialog} />;
  }

  return (
    <>
      <DecksGrid decks={currentDecks} showAuthor={state.activeTab === "public"} />
      <DecksCountFooter count={currentDecks.length} />
    </>
  );
}
