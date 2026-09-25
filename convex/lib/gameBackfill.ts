import { DEFAULT_GAME_ID, type GameId } from "../../shared/games/types";

/**
 * Tables that carry `game` (docs/multi-game.md "`game` on game-scoped tables").
 * Child tables reached through a scoped parent (tierListItems, deckLikes, …) are not listed.
 */
export const GAME_SCOPED_TABLES = [
  "cards",
  "sets",
  "cardDrafts",
  "formats",
  "cardLegality",
  "setLegality",
  "formatErrata",
  "cardTextHistory",
  "decks",
  "collections",
  "tierLists",
  "communityCardRankings",
  "communityTierSnapshots",
  "cardDataVersion",
  "cardFacetSnapshot",
  "ingestionJobs",
] as const;

export type GameScopedTable = (typeof GAME_SCOPED_TABLES)[number];

/**
 * Backfill transform for `migrations/backfillGameField`: docs written before multi-game have no
 * `game` and belong to the default game. Returns the patch, or `null` when nothing changes
 * (so the migration is idempotent).
 */
export function gameBackfillPatch(doc: { game?: unknown }): { game: GameId } | null {
  if (doc.game !== undefined && doc.game !== null) {
    return null;
  }
  return { game: DEFAULT_GAME_ID };
}
