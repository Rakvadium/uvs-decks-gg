import { DeckGridItem } from "../../deck-grid-item";
import type { DecksGridProps } from "./types";

export function DecksGrid({ decks, showAuthor }: DecksGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {decks.map((deck, index) => (
        <div
          key={deck._id}
          className="[content-visibility:auto] [contain-intrinsic-size:auto_280px]"
        >
          <DeckGridItem
            deck={deck}
            showAuthor={showAuthor}
            coverImagePriority={index < 6}
          />
        </div>
      ))}
    </div>
  );
}
