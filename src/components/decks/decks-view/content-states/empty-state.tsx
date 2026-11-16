import { Layers, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { DecksEmptyStateProps } from "./types";

const TITLES: Record<DecksEmptyStateProps["mode"], string> = {
  search: "No decks found",
  "my-decks": "No decks yet",
  tournament: "No tournament decks available",
  public: "No public decks available",
};

export function DecksEmptyState({ mode, onCreateDeck }: DecksEmptyStateProps) {
  return (
    <EmptyState
      variant="page"
      icon={mode === "search" ? Search : Layers}
      title={TITLES[mode]}
      description={mode === "search" ? "Try adjusting your search query" : undefined}
      action={
        mode === "my-decks" ? (
          <Button onClick={onCreateDeck}>
            <Plus />
            Create Your First Deck
          </Button>
        ) : undefined
      }
    />
  );
}
