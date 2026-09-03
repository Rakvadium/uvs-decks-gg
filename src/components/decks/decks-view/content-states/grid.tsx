import { DeckGridItem } from "../../deck-grid-item";
import {
  ACTIVE_DECK_CARD_DESIGN,
  type DeckCardDesign,
} from "../../deck-grid-item/types";
import type { DecksGridProps } from "./types";

const GRID_LAYOUT: Record<DeckCardDesign, { grid: string; cell: string }> = {
  nameplate: {
    grid: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
    cell: "[content-visibility:auto] [contain-intrinsic-size:auto_260px]",
  },
  splash: {
    grid: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5",
    cell: "[content-visibility:auto] [contain-intrinsic-size:auto_300px]",
  },
};

export function DecksGrid({ decks, showAuthor }: DecksGridProps) {
  const layout = GRID_LAYOUT[ACTIVE_DECK_CARD_DESIGN];

  return (
    <div className={layout.grid}>
      {decks.map((deck, index) => (
        <div key={deck._id} className={layout.cell}>
          <DeckGridItem
            deck={deck}
            design={ACTIVE_DECK_CARD_DESIGN}
            showAuthor={showAuthor}
            coverImagePriority={index < 8}
          />
        </div>
      ))}
    </div>
  );
}
