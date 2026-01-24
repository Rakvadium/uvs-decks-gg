import { Doc } from "../_generated/dataModel";

export interface CardFilterArgs {
  rarity?: string[];
  type?: string[];
  setCode?: string[];
  setName?: string[];
  excludeBackFaces?: boolean;
  excludeVariants?: boolean;
}

export function filterCards(
  cards: Doc<"cards">[],
  filters: CardFilterArgs
): Doc<"cards">[] {
  let result = cards;

  if (filters.excludeBackFaces !== false) {
    result = result.filter((card) => card.isFrontFace !== false);
  }

  if (filters.excludeVariants !== false) {
    result = result.filter((card) => card.isVariant !== true);
  }

  if (filters.rarity && filters.rarity.length > 0) {
    result = result.filter((card) => card.rarity && filters.rarity!.includes(card.rarity));
  }

  if (filters.type && filters.type.length > 0) {
    result = result.filter((card) => card.type && filters.type!.includes(card.type));
  }

  if (filters.setCode && filters.setCode.length > 0) {
    result = result.filter((card) => card.setCode && filters.setCode!.includes(card.setCode));
  }

  if (filters.setName && filters.setName.length > 0) {
    result = result.filter((card) => card.setName && filters.setName!.includes(card.setName));
  }

  return result;
}

export function filterFrontFaceCards(cards: Doc<"cards">[]): Doc<"cards">[] {
  return cards.filter((card) => card.isFrontFace !== false);
}

export function filterReleasedCards(cards: Doc<"cards">[]): Doc<"cards">[] {
  return cards.filter((card) => card.isFrontFace !== false && card.isVariant !== true);
}

