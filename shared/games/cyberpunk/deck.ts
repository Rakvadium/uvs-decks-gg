import type { SharedGameDeckModule } from "../deck";
import { canAddCyberpunkCardToDeck, getCyberpunkCardCopyLimit } from "./card-eligibility";
import { CYBERPUNK_CARD_TYPE_LABELS, CYBERPUNK_CARD_TYPE_ORDER } from "./card-types";
import { formatCyberpunkDeckText, parseCyberpunkDeckText } from "./deck-text";
import { CYBERPUNK_DECK_VALIDATION_RULES } from "./rules";
import {
  applyCyberpunkSetupPatch,
  cyberpunkSetupCardIds,
  cyberpunkSetupPreviewCardId,
  normalizeCyberpunkSetup,
} from "./setup";

/** Opening hand size for the draw simulator. */
export const CYBERPUNK_OPENING_HAND_SIZE = 6;

export const CYBERPUNK_DECK_MODULE = {
  normalizeSetup: normalizeCyberpunkSetup,
  applySetupPatch: applyCyberpunkSetupPatch,
  setupCardIds: cyberpunkSetupCardIds,
  setupPreviewCardId: cyberpunkSetupPreviewCardId,
  validation: CYBERPUNK_DECK_VALIDATION_RULES,
  cardTypeOrder: CYBERPUNK_CARD_TYPE_ORDER,
  cardTypeLabels: CYBERPUNK_CARD_TYPE_LABELS,
  // No sideboard (format `sideboardRule: "max:0"`).
  sideboardLimit: 0,
  isMainDeckEligible: canAddCyberpunkCardToDeck,
  getCardCopyLimit: getCyberpunkCardCopyLimit,
  simulatorHandSize: () => CYBERPUNK_OPENING_HAND_SIZE,
  // No zones in Cyberpunk TCG.
  extractZones: () => [],
  zoneTone: () => null,
  text: {
    mainTypeOrder: CYBERPUNK_CARD_TYPE_ORDER,
    parse: parseCyberpunkDeckText,
    format: formatCyberpunkDeckText,
  },
} as const satisfies SharedGameDeckModule;
