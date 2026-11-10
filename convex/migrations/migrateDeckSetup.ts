import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, internalQuery } from "../_generated/server";
import { deckSetupMigrationPatch } from "../../shared/games/uvs/setup";

/**
 * Backfill: write `decks.setup` from the legacy `decks.startingCharacterId` /
 * `decks.selectedIdentity` and keep the legacy fields mirrored from it (the live frontend still
 * reads them). Paginated and self-rescheduling; idempotent (UVS decks whose setup and legacy
 * fields already agree are skipped, as are non-UVS decks). Rerunning it restores legacy fields
 * that an earlier version of this migration removed.
 *
 * Start with `migrations/migrateDeckSetup:run` (no args). Check with `migrations/migrateDeckSetup:status`.
 */

const DEFAULT_BATCH_SIZE = 200;

const runResultValidator = v.object({
  scanned: v.number(),
  updated: v.number(),
  skipped: v.number(),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

type RunResult = typeof runResultValidator.type;

export const run = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
    /** Process a single page without rescheduling the next one. */
    once: v.optional(v.boolean()),
  },
  returns: runResultValidator,
  handler: async (ctx, args): Promise<RunResult> => {
    const batchSize = Math.max(1, Math.min(args.batchSize ?? DEFAULT_BATCH_SIZE, 1000));
    const page = await ctx.db
      .query("decks")
      .paginate({ numItems: batchSize, cursor: args.cursor ?? null });

    let updated = 0;
    let skipped = 0;
    for (const deck of page.page) {
      const patch = deckSetupMigrationPatch(deck);
      if (!patch) {
        skipped++;
        continue;
      }
      await ctx.db.patch(deck._id, patch);
      updated++;
    }

    if (!page.isDone && !args.once) {
      await ctx.scheduler.runAfter(0, internal.migrations.migrateDeckSetup.run, {
        cursor: page.continueCursor,
        batchSize,
      });
    }

    console.log(
      `migrateDeckSetup: scanned=${page.page.length} updated=${updated} skipped=${skipped} isDone=${page.isDone}`,
    );
    return {
      scanned: page.page.length,
      updated,
      skipped,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

/**
 * Read-only progress check over one page of decks. Call repeatedly with `continueCursor`
 * until `isDone`, summing `pending` (decks that still need the backfill).
 */
export const status = internalQuery({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    scanned: v.number(),
    pending: v.number(),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const batchSize = Math.max(1, Math.min(args.batchSize ?? 1000, 4000));
    const page = await ctx.db
      .query("decks")
      .paginate({ numItems: batchSize, cursor: args.cursor ?? null });
    let pending = 0;
    for (const deck of page.page) {
      if (deckSetupMigrationPatch(deck)) pending++;
    }
    return {
      scanned: page.page.length,
      pending,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});
