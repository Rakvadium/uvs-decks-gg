import { Plus } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useDecksSidebarContext } from "./context";
import { DeckSidebarItem } from "./deck-sidebar-item";

export function DecksSidebarList() {
  const {
    activeTab,
    currentDecks,
    isAuthenticated,
    isTabLoading,
    searchQuery,
    setIsCreateOpen,
  } = useDecksSidebarContext();

  if (!isAuthenticated && activeTab === "my-decks") {
    return <EmptyState variant="inline" title="Sign in to manage your decks" />;
  }

  if (isTabLoading) {
    return <LoadingState size="sm" label="Loading decks…" className="py-6" />;
  }

  if (currentDecks.length === 0) {
    return (
      <EmptyState
        variant="inline"
        title={
          searchQuery.trim()
            ? "No decks match your search"
            : activeTab === "public"
              ? "No public decks available"
              : activeTab === "tournament"
                ? "No tournament decks available"
                : "No decks yet"
        }
        action={
          !searchQuery.trim() && activeTab === "my-decks" && isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus />
              Create Your First Deck
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {currentDecks.map((deck) => (
        <DeckSidebarItem key={deck._id} deck={deck} />
      ))}
    </div>
  );
}
