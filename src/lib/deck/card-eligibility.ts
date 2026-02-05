export type DeckAddableCard = {
  difficulty?: number | null;
  control?: number | null;
  copyLimit?: number | null;
};

export function canAddCardToDeck(card: DeckAddableCard | null | undefined): boolean {
  if (!card) return true;
  const hasDifficulty = typeof card.difficulty === "number";
  const hasCheck = typeof card.control === "number";
  return hasDifficulty && hasCheck;
}

export type DeckSection = "main" | "side" | "reference";

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

export function canAddCardToSection(params: {
  card: DeckAddableCard | null | undefined;
  cardId: string;
  section: DeckSection;
  counts: DeckSectionCounts;
  quantity?: number;
}): boolean {
  const { card, cardId, section, counts, quantity } = params;
  if (!canAddCardToDeck(card)) return false;
  if (section === "reference") return true;

  const limit = getCardCopyLimit(card);
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
}): boolean {
  const { card, cardId, fromSection, toSection, counts, quantity } = params;
  if (fromSection === toSection) return true;
  if (!canAddCardToDeck(card)) return false;
  if (toSection === "reference") return true;
  if (fromSection !== "reference") return true;

  const limit = getCardCopyLimit(card);
  const { mainSide } = getCardSectionCounts(cardId, counts);
  const moveQuantity = Math.max(1, quantity ?? 1);
  return mainSide + moveQuantity <= limit;
}
