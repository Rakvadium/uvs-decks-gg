import type { SharedGameDeckModule } from "../deck";
import { canAddCardToDeck, getCardCopyLimit } from "./card-eligibility";
import { CARD_TYPE_LABELS, CARD_TYPE_ORDER } from "./card-types";
import { SIDEBAR_SIDEBOARD_LIMIT, UVS_MAIN_TYPE_ORDER, formatUvsUltraDeckExport, parseUvsUltraDeck } from "./deck-text";
import { UVS_DECK_VALIDATION_RULES } from "./rules";
import { applyDeckSetupPatch, deckSetupCardIds, normalizeDeckSetup } from "./setup";
import { extractZones, getZoneTone } from "./zones";

/** UVS simulator hand size: the starting character's `handSize`, else 0. */
export function uvsSimulatorHandSize<TCardId extends string>(
  setup: { startingCharacterId?: TCardId },
  getCard: (id: TCardId) => { handSize?: number | null } | null | undefined,
): number {
  const startingCharacter = setup.startingCharacterId ? (getCard(setup.startingCharacterId) ?? null) : null;
  return typeof startingCharacter?.handSize === "number" ? startingCharacter.handSize : 0;
}

export const UVS_DECK_MODULE = {
  normalizeSetup: normalizeDeckSetup,
  applySetupPatch: applyDeckSetupPatch,
  setupCardIds: deckSetupCardIds,
  validation: UVS_DECK_VALIDATION_RULES,
  cardTypeOrder: CARD_TYPE_ORDER,
  cardTypeLabels: CARD_TYPE_LABELS,
  sideboardLimit: SIDEBAR_SIDEBOARD_LIMIT,
  isMainDeckEligible: canAddCardToDeck,
  getCardCopyLimit,
  simulatorHandSize: uvsSimulatorHandSize,
  extractZones,
  zoneTone: getZoneTone,
  text: {
    mainTypeOrder: UVS_MAIN_TYPE_ORDER,
    parse: parseUvsUltraDeck,
    format: formatUvsUltraDeckExport,
  },
} as const satisfies SharedGameDeckModule;
