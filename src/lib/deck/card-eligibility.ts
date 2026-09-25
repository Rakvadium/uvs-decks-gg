// Compatibility wrapper: UVS deck eligibility lives in the shared UVS game module.
export {
  canAddCardToDeck,
  canAddCardToSection,
  canMoveCardToSection,
  getCardCopyLimit,
  getCardSectionCounts,
} from "@shared/games/uvs/card-eligibility";
export type {
  CardSectionCountSummary,
  DeckAddableCard,
  DeckSection,
  DeckSectionCounts,
} from "@shared/games/uvs/card-eligibility";
