import type { GameDeckSetupHelpers } from "../types";
import type { Id } from "../../../convex/_generated/dataModel";

/** UVS deck setup helpers (starting character). */
export const UVS_DECK_SETUP_HELPERS = {
  emptySetupLabel: "No character selected",
  simulatorSetupHint: "Select a starting character to enable simulator draws.",
  simulatorNoHandSizeHint: "Starting character has no hand size available.",
  importPatch(parsed, findCards) {
    if (!parsed.character) return { patch: null, unresolved: [] };
    const character = findCards(parsed.character.name)[0];
    if (!character) return { patch: null, unresolved: [parsed.character.name] };
    return { patch: { game: "uvs", startingCharacterId: character._id as Id<"cards"> }, unresolved: [] };
  },
  // Characters are picked through the setup panel; the gallery already hides their deck controls.
  resolveSetupAdd: () => null,
} as const satisfies GameDeckSetupHelpers;
