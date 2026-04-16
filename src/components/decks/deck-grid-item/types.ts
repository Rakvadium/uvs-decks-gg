import type { Doc } from "../../../../convex/_generated/dataModel";

export interface DeckGridItemProps {
  deck: Doc<"decks">;
  showAuthor?: boolean;
  coverImagePriority?: boolean;
}
