import { Doc } from "../../convex/_generated/dataModel";

type Card = Doc<"cards">;

export interface CardWithCount {
    card: Card;
    count: number;
}

export interface DeckStats {
    totalCards: number;
    uniqueCards: number;
    mainCount: number;
    sideCount: number;
    referenceCount: number;
    typeDistribution: Record<string, number>;
    rarityDistribution: Record<string, number>;
    costCurve: Record<number, number>;
}

export function calculateTotalCount(quantities: Record<string, number>): number {
    return Object.values(quantities).reduce((sum, count) => sum + count, 0);
}

export function calculateUniqueCount(quantities: Record<string, number>): number {
    return Object.keys(quantities).filter(key => quantities[key] > 0).length;
}

export function getTypeDistribution(cards: CardWithCount[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const { card, count } of cards) {
        const type = card.type ?? "Unknown";
        distribution[type] = (distribution[type] ?? 0) + count;
    }

    return distribution;
}

export function getRarityDistribution(cards: CardWithCount[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const { card, count } of cards) {
        const rarity = card.rarity ?? "Unknown";
        distribution[rarity] = (distribution[rarity] ?? 0) + count;
    }

    return distribution;
}

export function getCostCurve(cards: CardWithCount[], costField: "difficulty" | "control" = "difficulty"): Record<number, number> {
    const curve: Record<number, number> = {};

    for (const { card, count } of cards) {
        const cost = card[costField] ?? 0;
        curve[cost] = (curve[cost] ?? 0) + count;
    }

    return curve;
}

export function buildCardsWithCounts(
    cards: Card[],
    quantities: Record<string, number>
): CardWithCount[] {
    return cards.map(card => ({
        card,
        count: quantities[card._id.toString()] ?? 0,
    }));
}

