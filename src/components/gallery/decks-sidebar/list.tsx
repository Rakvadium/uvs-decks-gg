import { Loader2, Lock, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDecksSidebarContext } from "./context";
import { DeckSidebarItem } from "./deck-sidebar-item";

export function DecksSidebarList() {
  const isMobile = useIsMobile();
  const {
    activeTab,
    currentDecks,
    isAuthenticated,
    isTabLoading,
    searchQuery,
    setIsCreateOpen,
  } = useDecksSidebarContext();

  if (activeTab === "tournament") {
    return (
      <div className="rounded-lg border border-dashed border-secondary/30 bg-secondary/5 px-4 py-6 text-center">
        <Trophy className="mx-auto h-8 w-8 text-secondary/60" />
        <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Tournament decks coming soon
        </p>
      </div>
    );
  }

  if (!isAuthenticated && activeTab === "my-decks") {
    return (
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-primary/60" />
        <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Sign in to manage your decks
        </p>
      </div>
    );
  }

  if (isTabLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading decks</span>
      </div>
    );
  }

  if (currentDecks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 bg-card/30 px-4 py-6 text-center">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {searchQuery.trim()
            ? "No decks match your search"
            : activeTab === "public"
              ? "No public decks available"
              : "No decks yet"}
        </p>

        {!searchQuery.trim() && activeTab === "my-decks" && isAuthenticated && !isMobile ? (
          <Button
            variant="neon"
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
    <>
      {currentDecks.map((deck) => (
        <DeckSidebarItem key={deck._id} deck={deck} />
      ))}
    </>
  );
}
