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

/**
 * Looks up an existing doc of `game` by trying each `gameValuesWithLegacy(game)` index value in
 * order (tagged first, then untagged legacy rows for the default game). Writers use it before
 * insert so ingest before the backfill updates the legacy row instead of inserting a duplicate
 * (which a later `.unique()` would trip over); pair with `gameTagPatch` to tag the row found.
 */
export async function findInGame<T>(
  game: GameId,
  lookup: (value: GameId | undefined) => Promise<T | null>,
): Promise<T | null> {
  for (const value of gameValuesWithLegacy(game)) {
    const doc = await lookup(value);
    if (doc !== null && doc !== undefined) return doc;
  }
  return null;
}

/** Like `findInGame`, but concatenates every index value's rows (tagged first, then legacy). */
export async function collectInGame<T>(
  game: GameId,
  lookup: (value: GameId | undefined) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  for (const value of gameValuesWithLegacy(game)) {
    rows.push(...(await lookup(value)));
  }
  return rows;
}

/** Patch that tags a legacy (untagged) doc with `game`; `null` when it is already tagged. */
export function gameTagPatch(doc: { game?: GameId }, game: GameId): { game: GameId } | null {
  return doc.game === undefined ? { game } : null;
}

/**
 * `.unique()` replacement for lookups that may see duplicates written before the backfill:
 * returns the first row and logs instead of throwing.
 */
export async function firstLoggingDuplicates<T>(
  query: { take: (n: number) => Promise<T[]> },
  label: string,
): Promise<T | null> {
  const rows = await query.take(2);
  if (rows.length > 1) {
    console.warn(`Duplicate rows for ${label}; using the first`);
  }
  return rows[0] ?? null;
}

/** Set of `game` by code, legacy-aware (see `findInGame`). */
export async function findSetByCode(
  ctx: DbCtx,
  game: GameId,
  code: string,
): Promise<Doc<"sets"> | null> {
  return await findInGame(game, (value) =>
    firstLoggingDuplicates(
      ctx.db.query("sets").withIndex("by_game_and_code", (q) => q.eq("game", value).eq("code", code)),
      `sets ${game}/${code}`,
    ),
  );
}

/** Format of `game` by key, legacy-aware (see `findInGame`). */
export async function findFormatByKey(
  ctx: DbCtx,
  game: GameId,
  key: string,
): Promise<Doc<"formats"> | null> {
  return await findInGame(game, (value) =>
    firstLoggingDuplicates(
      ctx.db.query("formats").withIndex("by_game_and_key", (q) => q.eq("game", value).eq("key", key)),
      `formats ${game}/${key}`,
    ),
  );
}

/** The game's default format (`isDefault`, else the oldest), legacy-aware. */
export async function findDefaultFormat(ctx: DbCtx, game: GameId): Promise<Doc<"formats"> | null> {
  const formats = byCreationTime(
    await collectInGame(game, (value) =>
      ctx.db.query("formats").withIndex("by_game_and_key", (q) => q.eq("game", value)).collect(),
    ),
  );
  return formats.find((f) => f.isDefault) ?? formats[0] ?? null;
}

/** Card of `game` by set code + collector number, legacy-aware (see `findInGame`). */
export async function findCardBySetAndNumber(
  ctx: DbCtx,
  game: GameId,
  setCode: string,
  collectorNumber: string,
): Promise<Doc<"cards"> | null> {
  return await findInGame(game, (value) =>
    ctx.db
      .query("cards")
      .withIndex("by_game_and_setCode_and_collectorNumber", (q) =>
        q.eq("game", value).eq("setCode", setCode).eq("collectorNumber", collectorNumber),
      )
      .first(),
  );
}

/** Set legality row of `game` for (format, set), legacy-aware (see `findInGame`). */
export async function findSetLegality(
  ctx: DbCtx,
  game: GameId,
  formatKey: string,
  setCode: string,
): Promise<Doc<"setLegality"> | null> {
  return await findInGame(game, (value) =>
    firstLoggingDuplicates(
      ctx.db
        .query("setLegality")
        .withIndex("by_game_and_format_set", (q) =>
          q.eq("game", value).eq("formatKey", formatKey).eq("setCode", setCode),
        ),
      `setLegality ${game}/${formatKey}/${setCode}`,
    ),
  );
}

/**
 * Rolling-deploy compatibility: public functions take `game: v.optional(gameIdValidator)` so
 * frontends built before multi-game (tabs open during a deploy) keep working; a missing value is
 * the default game. Clients always pass `game`. Tighten to required in the follow-up change.
 */
export function resolveGame(game: GameId | undefined): GameId {
  return game ?? DEFAULT_GAME_ID;
}

/** `args` with `game` resolved via `resolveGame` (keeps `args.game` typed as `GameId`). */
export function withResolvedGame<T extends { game?: GameId }>(
  args: T,
): Omit<T, "game"> & { game: GameId } {
  return { ...args, game: resolveGame(args.game) };
}
