import type { Doc } from "../../../../convex/_generated/dataModel";

export type DeckListItem = Doc<"decks"> & { ownerUsername?: string };

export interface DeckGridItemProps {
  deck: DeckListItem;
  showAuthor?: boolean;
  coverImagePriority?: boolean;
}
