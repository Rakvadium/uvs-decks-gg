import type { Doc } from "../../../../../convex/_generated/dataModel";

export type DecksEmptyMode = "search" | "my-decks" | "public";

export interface DecksEmptyStateProps {
  mode: DecksEmptyMode;
  onCreateDeck?: () => void;
}

export interface DecksGridProps {
  decks: Doc<"decks">[];
  showAuthor: boolean;
}

export interface DecksCountFooterProps {
  count: number;
}
