import { normalizeCyberpunkSetup } from "@shared/games/cyberpunk/setup";
import type { Id } from "../../../convex/_generated/dataModel";
import type { GameDeckSetupHelpers } from "../types";
import { resolveImportedLegends, resolveLegendAdd } from "./components/deck/legend-model";

/** Cyberpunk deck setup helpers (Legends). */
export const CYBERPUNK_DECK_SETUP_HELPERS = {
  emptySetupLabel: "No Legends selected",
  // Opening hand is always 6; draws don't depend on the Legends.
  simulatorSetupHint: null,
  simulatorNoHandSizeHint: null,
  importPatch(parsed, findCards) {
    const { legendIds, unresolved } = resolveImportedLegends(parsed.setupCards, findCards);
    return {
      patch: legendIds ? { game: "cyberpunk", legendIds: legendIds as Id<"cards">[] } : null,
      unresolved,
    };
  },
  resolveSetupAdd(card, setup, getCard) {
    const resolution = resolveLegendAdd(card, normalizeCyberpunkSetup({ setup }).legendIds, getCard);
    if (!resolution) return null;
    if (resolution.kind === "blocked") return resolution;
    return {
      kind: "add",
      message: resolution.message,
      actionLabel: resolution.actionLabel,
      patch: { game: "cyberpunk", legendIds: resolution.legendIds as Id<"cards">[] },
    };
  },
} as const satisfies GameDeckSetupHelpers;
