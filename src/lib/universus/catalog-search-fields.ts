/**
 * Rebuilds the gallery's text-search fields (`searchText`, `searchAll`) on the client.
 *
 * The static catalog omits them (they repeat each card's own fields and were about a third of the
 * file), so every gallery card gets them here, lowercased, before it is shown or searched. Each
 * game keeps the format most of its cards were stored with, so search results don't change.
 */
import type { GameId } from "@shared/games/types";
import type { CachedCard } from "./card-store";

type SearchFields = Pick<CachedCard, "searchText" | "searchAll">;

/**
 * UniVersus: `searchText` is keywords then ability text with `|` separators as spaces (the format
 * most cards were stored with; the name is left to Name search). `searchAll` adds the name, set,
 * type and rarity, as newer cards and other games already had.
 */
function uvsSearchFields(card: CachedCard): SearchFields {
  const searchText = `${card.keywords ?? ""} ${card.text ?? ""}`.toLowerCase().replace(/\|/g, " ");
  const searchAll = [
    card.searchName ?? card.name,
    searchText,
    card.setName ?? "",
    card.type ?? "",
    card.rarity ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return { searchText, searchAll };
}

/** Other games: the backend's `deriveCardSearchFields` (convex/lib/cardCreate.ts), lowercased. */
function defaultSearchFields(card: CachedCard): SearchFields {
  const tags = card.tags
    ?.split("|")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(" ");
  const searchText = [
    card.name,
    ...(card.subname ? [card.subname] : []),
    card.keywords ?? "",
    ...(tags ? [tags] : []),
    card.text ?? "",
  ].join(" ");
  const searchAll = [
    card.searchName ?? card.name,
    searchText,
    card.setName ?? "",
    card.type ?? "",
    card.rarity ?? "",
    ...(card.color ? [card.color] : []),
  ].join(" ");
  return { searchText: searchText.toLowerCase(), searchAll: searchAll.toLowerCase() };
}

/** Sets lowercased `searchText` / `searchAll` on each card, in place. */
export function applyCatalogSearchFields(cards: CachedCard[], game: GameId): void {
  const derive = game === "uvs" ? uvsSearchFields : defaultSearchFields;
  for (const card of cards) {
    const fields = derive(card);
    card.searchText = fields.searchText;
    card.searchAll = fields.searchAll;
  }
}

/** Copies of `cards` without the rebuilt search fields, for the IndexedDB cache. */
export function withoutCatalogSearchFields(cards: CachedCard[]): CachedCard[] {
  return cards.map((card) => {
    const copy = { ...card };
    delete copy.searchText;
    delete copy.searchAll;
    return copy;
  });
}
