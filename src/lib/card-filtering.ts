import { Doc } from "../../convex/_generated/dataModel";
import type { CardFilters } from "@/providers/UIStateProvider";

type Card = Doc<"cards">;

export interface StatFilterValue {
    operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte";
    value: number;
}

export function applyStatFilter(cardValue: number, filter: StatFilterValue): boolean {
    switch (filter.operator) {
        case "eq":
            return cardValue === filter.value;
        case "neq":
            return cardValue !== filter.value;
        case "gt":
            return cardValue > filter.value;
        case "lt":
            return cardValue < filter.value;
        case "gte":
            return cardValue >= filter.value;
        case "lte":
            return cardValue <= filter.value;
        default:
            return true;
    }
}

export function filterCardsBySearch(cards: Card[], search?: string): Card[] {
    if (!search || search.trim() === "") return cards;

    const searchLower = search.toLowerCase();
    return cards.filter((card) =>
        card.name.toLowerCase().includes(searchLower) ||
        (card.searchName && card.searchName.toLowerCase().includes(searchLower)) ||
        (card.text && card.text.toLowerCase().includes(searchLower))
    );
}

export function filterCardsByRarity(cards: Card[], rarities?: string[]): Card[] {
    if (!rarities || rarities.length === 0) return cards;
    return cards.filter((card) => card.rarity && rarities.includes(card.rarity));
}

export function filterCardsByType(cards: Card[], types?: string[]): Card[] {
    if (!types || types.length === 0) return cards;
    return cards.filter((card) => card.type && types.includes(card.type));
}

export function filterCardsBySet(cards: Card[], setCodes?: string[]): Card[] {
    if (!setCodes || setCodes.length === 0) return cards;
    return cards.filter((card) => card.setCode && setCodes.includes(card.setCode));
}

export function filterCardsByKeywords(cards: Card[], keywords?: string[]): Card[] {
    if (!keywords || keywords.length === 0) return cards;
    return cards.filter((card) => {
        if (!card.keywords) return false;
        const cardKeywords = card.keywords.split("|").map(k => k.trim());
        return keywords.some(kw => 
            cardKeywords.some(ck => ck === kw || ck.startsWith(`${kw}:`))
        );
    });
}

export function applyBaseFilters(cards: Card[], filters: CardFilters): Card[] {
    let filtered = cards;

    filtered = filterCardsBySearch(filtered, filters.search);
    filtered = filterCardsByRarity(filtered, filters.rarity);
    filtered = filterCardsByType(filtered, filters.type);
    filtered = filterCardsBySet(filtered, filters.set);

    return filtered;
}

