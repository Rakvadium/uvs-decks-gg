import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { DEFAULT_GAME_ID, type GameId } from "../../shared/games/types";

/**
 * Game scoping helpers (docs/multi-game.md "`game` on game-scoped tables").
 * `game` is optional in the schema until the backfill (`migrations/backfillGameField`) has run,
 * so a missing value means the default game wherever we can't use a game-leading index.
 */

type MaybeGameDoc = { game?: GameId } | null | undefined;

/** The game a doc belongs to (docs written before the backfill belong to the default game). */
export function docGame(doc: { game?: GameId }): GameId {
  return doc.game ?? DEFAULT_GAME_ID;
}

/** True when `doc` exists and belongs to `game`. */
export function isDocInGame<T extends MaybeGameDoc>(doc: T, game: GameId): doc is NonNullable<T> {
  return doc !== null && doc !== undefined && docGame(doc) === game;
}

/**
 * Index values to read for a game where legacy rows must still count: the rows tagged with `game`,
 * then (default game only) untagged rows (`game === undefined`) written before the backfill.
 * Used for singletons and aggregate rebuilds so dev/prod keep working before the backfill.
 */
export function gameValuesWithLegacy(game: GameId): Array<GameId | undefined> {
  return game === DEFAULT_GAME_ID ? [game, undefined] : [game];
}

/**
 * Sorts docs read through a game-leading index back into table-scan (`_creationTime`) order,
 * so switching a whole-table `.collect()` to a game index keeps the old ordering.
 */
export function byCreationTime<T extends { _creationTime: number }>(docs: T[]): T[] {
  return docs.sort((a, b) => a._creationTime - b._creationTime);
}

type DbCtx = Pick<QueryCtx, "db">;

/** Per-game `cardDataVersion` row (falls back to the legacy untagged row for the default game). */
export async function getCardDataVersionDoc(
  ctx: DbCtx,
  game: GameId,
): Promise<Doc<"cardDataVersion"> | null> {
  for (const value of gameValuesWithLegacy(game)) {
    const row = await ctx.db
      .query("cardDataVersion")
      .withIndex("by_game", (q) => q.eq("game", value))
      .first();
    if (row) return row;
  }
  return null;
}

/** Per-game `cardFacetSnapshot` row (falls back to the legacy untagged row for the default game). */
export async function getCardFacetSnapshotDoc(
  ctx: DbCtx,
  game: GameId,
): Promise<Doc<"cardFacetSnapshot"> | null> {
  for (const value of gameValuesWithLegacy(game)) {
    const row = await ctx.db
      .query("cardFacetSnapshot")
      .withIndex("by_game_and_key", (q) => q.eq("game", value).eq("key", "default"))
      .first();
    if (row) return row;
  }
  return null;
}
