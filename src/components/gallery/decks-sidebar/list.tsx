import { Loader2, Lock, Plus } from "lucide-react";
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
    return (
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/10 px-4 py-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-primary/60" />
        <p className="chrome-label-case mt-3 text-xs text-muted-foreground">
          Sign in to manage your decks
        </p>
      </div>
    );
  }

  if (isTabLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="chrome-label-case text-xs">Loading decks…</span>
      </div>
    );
  }

  if (currentDecks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-card/30 px-4 py-6 text-center">
        <p className="chrome-label-case text-xs text-muted-foreground">
          {searchQuery.trim()
            ? "No decks match your search"
            : activeTab === "public"
              ? "No public decks available"
              : activeTab === "tournament"
                ? "No tournament decks available"
                : "No decks yet"}
        </p>

        {!searchQuery.trim() && activeTab === "my-decks" && isAuthenticated ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Your First Deck
          </Button>
        ) : null}
      </div>
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
