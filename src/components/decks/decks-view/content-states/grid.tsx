import { DeckGridItem } from "../../deck-grid-item";
import type { DecksGridProps } from "./types";

export function DecksGrid({ decks, showAuthor }: DecksGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <DeckGridItem key={deck._id} deck={deck} showAuthor={showAuthor} />
      ))}
    </div>
  );
}
