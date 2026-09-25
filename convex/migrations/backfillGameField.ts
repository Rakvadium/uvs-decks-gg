import { v } from "convex/values";
import type { PaginationOptions, PaginationResult } from "convex/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalMutation, internalQuery, type QueryCtx } from "../_generated/server";
import { GAME_SCOPED_TABLES, gameBackfillPatch, type GameScopedTable } from "../lib/gameBackfill";

/**
 * Backfill: set `game: "uvs"` (DEFAULT_GAME_ID) on every doc of the game-scoped tables that has
 * no `game` yet (docs/multi-game.md). Paginated (one table per invocation, 200 docs per page),
 * self-rescheduling until the table is done, idempotent (tagged docs are skipped).
 *
 *   npx convex run migrations/backfillGameField:runAll            # every table
 *   npx convex run migrations/backfillGameField:run '{"table":"cards"}'
 *   npx convex run migrations/backfillGameField:status '{"table":"cards"}'   # loop on continueCursor
 */

const DEFAULT_BATCH_SIZE = 200;

const tableValidator = v.union(
  ...GAME_SCOPED_TABLES.map((table) => v.literal(table)),
);

type BackfillDoc = { _id: Id<GameScopedTable>; game?: unknown };

/** Pages through any game-scoped table (the tables share only `_id` / `game` for this purpose). */
async function paginateTable(
  ctx: Pick<QueryCtx, "db">,
  table: GameScopedTable,
  opts: PaginationOptions,
): Promise<PaginationResult<BackfillDoc>> {
  const query = ctx.db.query(table) as unknown as {
    paginate: (opts: PaginationOptions) => Promise<PaginationResult<BackfillDoc>>;
  };
  return await query.paginate(opts);
}

function clampBatchSize(batchSize: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(batchSize ?? fallback, max));
}

const runResultValidator = v.object({
  table: tableValidator,
  scanned: v.number(),
  updated: v.number(),
  skipped: v.number(),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

type RunResult = typeof runResultValidator.type;

export const run = internalMutation({
  args: {
    table: tableValidator,
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
    /** Process a single page without rescheduling the next one. */
    once: v.optional(v.boolean()),
  },
  returns: runResultValidator,
  handler: async (ctx, args): Promise<RunResult> => {
    const batchSize = clampBatchSize(args.batchSize, DEFAULT_BATCH_SIZE, 1000);
    const page = await paginateTable(ctx, args.table, {
      numItems: batchSize,
      cursor: args.cursor ?? null,
    });

    let updated = 0;
    let skipped = 0;
    for (const doc of page.page) {
      const patch = gameBackfillPatch(doc);
      if (!patch) {
        skipped++;
        continue;
      }
      // Every game-scoped table has `game: v.optional(gameIdValidator)`.
      await ctx.db.patch(doc._id as Id<"cards">, patch);
      updated++;
    }

    if (!page.isDone && !args.once) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillGameField.run, {
        table: args.table,
        cursor: page.continueCursor,
        batchSize,
      });
    }

    console.log(
      `backfillGameField(${args.table}): scanned=${page.page.length} updated=${updated} skipped=${skipped} isDone=${page.isDone}`,
    );
    return {
      table: args.table,
      scanned: page.page.length,
      updated,
      skipped,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

/** Starts `run` for every game-scoped table (each table then reschedules itself until done). */
export const runAll = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  returns: v.array(tableValidator),
  handler: async (ctx, args) => {
    for (const table of GAME_SCOPED_TABLES) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillGameField.run, {
        table,
        cursor: null,
        batchSize: args.batchSize,
      });
    }
    return [...GAME_SCOPED_TABLES];
  },
});

/**
 * Read-only progress check over one page of `table`. Call repeatedly with `continueCursor`
 * until `isDone`, summing `pending` (docs that still have no `game`).
 */
export const status = internalQuery({
  args: {
    table: tableValidator,
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    table: tableValidator,
    scanned: v.number(),
    pending: v.number(),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const batchSize = clampBatchSize(args.batchSize, 1000, 4000);
    const page = await paginateTable(ctx, args.table, {
      numItems: batchSize,
      cursor: args.cursor ?? null,
    });
    let pending = 0;
    for (const doc of page.page) {
      if (gameBackfillPatch(doc)) pending++;
    }
    return {
      table: args.table,
      scanned: page.page.length,
      pending,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});
