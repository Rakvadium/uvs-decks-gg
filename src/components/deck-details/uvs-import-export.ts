// Compatibility wrapper: the UVS Ultra text format lives in the shared UVS game module.
import type { Id } from "../../../convex/_generated/dataModel";
import type { CachedCard } from "@/lib/universus/card-store";

export {
  SIDEBAR_SIDEBOARD_LIMIT,
  UVS_MAIN_TYPE_ORDER,
  buildCardNameIndex,
  findCardByName,
  formatUvsUltraDeckExport,
  incrementCount,
  parseUvsUltraDeck,
  sumLineEntries,
  sumQuantities,
} from "@shared/games/uvs/deck-text";
export type { CardNameIndex, ParsedUvsUltraDeck, UvsUltraDeckLine } from "@shared/games/uvs/deck-text";

export function toCardId(card: CachedCard): Id<"cards"> {
  return card._id as Id<"cards">;
}
