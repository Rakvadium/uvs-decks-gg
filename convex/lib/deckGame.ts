import type { Doc } from "../_generated/dataModel";
import type { SharedGameModule } from "../../shared/games/types";
import { getSharedGameModuleOrDefault } from "../../shared/games/registry";

/** The game module a deck belongs to (decks without `game` belong to the default game). */
export function deckGameModule(deck: Doc<"decks">): SharedGameModule {
  // TODO(multi-game): read `deck.game` directly once the field exists on the decks schema.
  return getSharedGameModuleOrDefault((deck as { game?: string }).game);
}
