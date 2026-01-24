import { Doc } from "../../convex/_generated/dataModel";

type Card = Doc<"cards">;

export type BaseSortField = "name" | "type" | "rarity" | "set" | "quantity";
export type SortDirection = "asc" | "desc";

export interface CardWithCount {
  card: Card;
  count: number;
}

export function compareCards(
  a: Card,
  b: Card,
  sortField: string,
  sortDirection: SortDirection = "asc"
): number {
  let comparison = 0;

  switch (sortField) {
    case "name":
      comparison = a.name.localeCompare(b.name);
      break;
    case "type":
      comparison = (a.type ?? "").localeCompare(b.type ?? "");
      break;
    case "rarity":
      comparison = (a.rarity ?? "").localeCompare(b.rarity ?? "");
      break;
    case "set":
    case "setCode":
      comparison = (a.setCode ?? "").localeCompare(b.setCode ?? "");
      break;
    case "setNumber":
      comparison = (a.setNumber ?? 0) - (b.setNumber ?? 0);
      break;
    case "collectorNumber":
      comparison = parseInt(a.collectorNumber ?? "0", 10) - parseInt(b.collectorNumber ?? "0", 10);
      break;
    case "difficulty":
      comparison = (a.difficulty ?? 0) - (b.difficulty ?? 0);
      break;
    case "control":
      comparison = (a.control ?? 0) - (b.control ?? 0);
      break;
    default:
      comparison = a.name.localeCompare(b.name);
  }

  return sortDirection === "desc" ? -comparison : comparison;
}

export function compareCardsWithCount(
  a: CardWithCount,
  b: CardWithCount,
  sortField: string,
  sortDirection: SortDirection = "asc"
): number {
  if (sortField === "quantity") {
    const comparison = a.count - b.count;
    return sortDirection === "desc" ? -comparison : comparison;
  }
  return compareCards(a.card, b.card, sortField, sortDirection);
}

export function sortCards(
  cards: Card[],
  sortField: string,
  sortDirection: SortDirection = "asc"
): Card[] {
  return [...cards].sort((a, b) => compareCards(a, b, sortField, sortDirection));
}

export function sortCardsWithCount(
  cards: CardWithCount[],
  sortField: string,
  sortDirection: SortDirection = "asc"
): CardWithCount[] {
  return [...cards].sort((a, b) => compareCardsWithCount(a, b, sortField, sortDirection));
}

export function groupCardsByType(cards: CardWithCount[]): Record<string, CardWithCount[]> {
  const groups: Record<string, CardWithCount[]> = {};

  for (const item of cards) {
    const type = item.card.type ?? "Unknown";
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
  }

  return groups;
}

export function getOrderedTypeKeys(groups: Record<string, CardWithCount[]>): string[] {
  return Object.keys(groups).sort();
}

