import type { GameDeckImportExportFeature } from "@shared/games/features";
import { useGameFeatures } from "@/games/game-context";

const PLAIN_TEXT: GameDeckImportExportFeature = { formatLabel: "Plain text", placeholder: "" };

/** Labels/placeholder for the Import/Export tool (only registered when the feature is on). */
export function useDeckImportExportFeature(): GameDeckImportExportFeature {
  return useGameFeatures().deckImportExport || PLAIN_TEXT;
}
