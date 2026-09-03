import type { Doc } from "../../../../convex/_generated/dataModel";

export type DeckListItem = Doc<"decks"> & { ownerUsername?: string };

export type DeckCardDesign = "nameplate" | "splash";

export const ACTIVE_DECK_CARD_DESIGN: DeckCardDesign = "nameplate";

export interface DeckGridItemProps {
  deck: DeckListItem;
  showAuthor?: boolean;
  coverImagePriority?: boolean;
  design?: DeckCardDesign;
}
