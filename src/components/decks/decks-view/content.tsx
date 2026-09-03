import { useMemo, type ReactNode } from "react";
import { useDecks } from "@/providers/DecksProvider";
import {
  DecksAuthRequiredState,
  DecksCountFooter,
  DecksEmptyState,
  DecksGrid,
  DecksLoadingState,
} from "./content-states";
import { DecksGuestBrowseBanner } from "./guest-browse-banner";

function getEmptyMode(
  searchQuery: string,
  activeTab: "my-decks" | "public" | "tournament",
) {
  if (searchQuery.trim()) return "search";
  if (activeTab === "my-decks") return "my-decks";
  if (activeTab === "tournament") return "tournament";
  return "public";
}

function withGuestBrowseBanner(isAuthenticated: boolean, body: ReactNode) {
  if (isAuthenticated) return body;
  return (
    <div className="space-y-4">
      <DecksGuestBrowseBanner />
      {body}
    </div>
  );
}

export function DecksViewContent() {
  const { state, actions, catalog } = useDecks();
  const { isAuthenticated, isTabLoading, currentDecks } = catalog;

  const emptyMode = useMemo(
    () => getEmptyMode(state.searchQuery, state.activeTab),
    [state.searchQuery, state.activeTab],
  );

  if (isTabLoading) {
    return <DecksLoadingState />;
  }

  if (!isAuthenticated && state.activeTab === "my-decks") {
    return <DecksAuthRequiredState />;
  }

  if (currentDecks.length === 0) {
    return withGuestBrowseBanner(
      isAuthenticated,
      <DecksEmptyState
        mode={emptyMode}
        onCreateDeck={actions.openCreateDialog}
      />,
    );
  }

  return withGuestBrowseBanner(
    isAuthenticated,
    <>
      <DecksGrid
        decks={currentDecks}
        showAuthor={
          state.activeTab === "public" || state.activeTab === "tournament"
        }
      />
      <DecksCountFooter count={currentDecks.length} />
    </>,
  );
}
