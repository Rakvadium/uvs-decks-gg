import type { DeckAddableCard, DeckSection, SharedGameDeckModule } from "../deck";

export type { DeckAddableCard, DeckSection };

/**
 * Per-game card rules the section helpers apply (pass `module.deck`). Defaults to UVS so existing
 * callers keep their behavior.
 */
export type DeckCardRules = Pick<SharedGameDeckModule, "isMainDeckEligible" | "getCardCopyLimit">;

/** UVS: only cards with numeric difficulty and check (control) may be put in a deck. */
export function canAddCardToDeck(card: DeckAddableCard | null | undefined): boolean {
  if (!card) return true;
  const hasDifficulty = typeof card.difficulty === "number";
  const hasCheck = typeof card.control === "number";
  return hasDifficulty && hasCheck;
}

export type DeckSectionCounts = {
  mainCounts: Record<string, number>;
  sideCounts: Record<string, number>;
  referenceCounts: Record<string, number>;
};

export type CardSectionCountSummary = {
  main: number;
  side: number;
  reference: number;
  mainSide: number;
  total: number;
};

export function getCardCopyLimit(card: DeckAddableCard | null | undefined): number {
  if (!card) return Number.POSITIVE_INFINITY;
  const limit = typeof card.copyLimit === "number" ? card.copyLimit : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(limit) || limit <= 0) return Number.POSITIVE_INFINITY;
  return limit;
}

export function getCardSectionCounts(cardId: string, counts: DeckSectionCounts): CardSectionCountSummary {
  const main = counts.mainCounts[cardId] ?? 0;
  const side = counts.sideCounts[cardId] ?? 0;
  const reference = counts.referenceCounts[cardId] ?? 0;
  const mainSide = main + side;
  const total = mainSide + reference;
  return { main, side, reference, mainSide, total };
}

const UVS_CARD_RULES: DeckCardRules = {
  isMainDeckEligible: canAddCardToDeck,
  getCardCopyLimit,
};

export function canAddCardToSection(params: {
  card: DeckAddableCard | null | undefined;
  cardId: string;
  section: DeckSection;
  counts: DeckSectionCounts;
  quantity?: number;
  rules?: DeckCardRules;
}): boolean {
  const { card, cardId, section, counts, quantity, rules = UVS_CARD_RULES } = params;
  if (!rules.isMainDeckEligible(card)) return false;
  if (section === "reference") return true;

  const limit = rules.getCardCopyLimit(card);
  const { mainSide } = getCardSectionCounts(cardId, counts);
  const addQuantity = Math.max(1, quantity ?? 1);
  return mainSide + addQuantity <= limit;
}

export function canMoveCardToSection(params: {
  card: DeckAddableCard | null | undefined;
  cardId: string;
  fromSection: DeckSection;
  toSection: DeckSection;
  counts: DeckSectionCounts;
  quantity?: number;
  rules?: DeckCardRules;
}): boolean {
  const { card, cardId, fromSection, toSection, counts, quantity, rules = UVS_CARD_RULES } = params;
  if (fromSection === toSection) return true;
  if (!rules.isMainDeckEligible(card)) return false;
  if (toSection === "reference") return true;
  if (fromSection !== "reference") return true;

  const limit = rules.getCardCopyLimit(card);
  const { mainSide } = getCardSectionCounts(cardId, counts);
  const moveQuantity = Math.max(1, quantity ?? 1);
  return mainSide + moveQuantity <= limit;
}
