import { Layers, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DecksEmptyStateProps } from "./types";

export function DecksEmptyState({ mode, onCreateDeck }: DecksEmptyStateProps) {
  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-primary/30 shadow-[0_0_20px_-5px_var(--primary)]">
          {mode === "search" ? <Search className="h-8 w-8 text-primary/50" /> : <Layers className="h-8 w-8 text-primary/50" />}
        </div>

        {mode === "search" ? (
          <>
            <p className="mb-2 font-mono text-sm uppercase tracking-wider text-muted-foreground">No decks found</p>
            <p className="text-sm text-muted-foreground/60">Try adjusting your search query</p>
          </>
        ) : mode === "my-decks" ? (
          <>
            <p className="mb-6 font-mono text-sm uppercase tracking-wider text-muted-foreground">No decks yet</p>
            <Button variant="neon" onClick={onCreateDeck}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Deck
            </Button>
          </>
        ) : (
          <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            No public decks available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
