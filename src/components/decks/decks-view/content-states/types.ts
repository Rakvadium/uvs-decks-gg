import type { DeckListItem } from "../../deck-grid-item/types";

export type DecksEmptyMode = "search" | "my-decks" | "public" | "tournament";

export interface DecksEmptyStateProps {
  mode: DecksEmptyMode;
  onCreateDeck?: () => void;
}

export interface DecksGridProps {
  decks: DeckListItem[];
  showAuthor: boolean;
}

export interface DecksCountFooterProps {
  count: number;
}
