import { Layers, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DecksEmptyStateProps } from "./types";

export function DecksEmptyState({ mode, onCreateDeck }: DecksEmptyStateProps) {
  return (
    <Card className="border-2 border-dashed border-border/80">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-border/50" style={{ boxShadow: "var(--chrome-deck-state-icon-shadow)" }}>
          {mode === "search" ? <Search className="h-8 w-8 text-primary/50" /> : <Layers className="h-8 w-8 text-primary/50" />}
        </div>

        {mode === "search" ? (
          <>
            <p className="chrome-label-case mb-2 text-sm text-muted-foreground">No decks found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
          </>
        ) : mode === "my-decks" ? (
          <>
            <p className="chrome-label-case mb-6 text-sm text-muted-foreground">No decks yet</p>
            <Button variant="default" onClick={onCreateDeck}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Deck
            </Button>
          </>
        ) : mode === "tournament" ? (
          <p className="chrome-label-case text-sm text-muted-foreground">
            No tournament decks available
          </p>
        ) : (
          <p className="chrome-label-case text-sm text-muted-foreground">
            No public decks available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
