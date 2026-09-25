import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { runCatalogAggregateRefresh } from "./cardFacets";
import { CATALOG_STATIC_SCHEMA_VERSION, catalogObjectKeysToDelete } from "./publicCardUrls";
import { gameIdValidator } from "./validators";
import { getCardDataVersionDoc, resolveGame } from "./lib/gameScope";

const CATALOG_VERSIONS_TO_RETAIN = 5;

const releaseResultValidator = v.object({
  version: v.number(),
  cardCount: v.number(),
  previousVersion: v.union(v.number(), v.null()),
  catalogUrl: v.string(),
});

export const prepareRelease = internalQuery({
  args: { game: gameIdValidator },
  returns: v.object({
    nextVersion: v.number(),
    previousVersion: v.union(v.number(), v.null()),
    releaseAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const existing = await getCardDataVersionDoc(ctx, args.game);
    const previousVersion = existing?.version ?? null;
    const nextVersion = previousVersion === null ? 1 : previousVersion + 1;
    return {
      nextVersion,
      previousVersion,
      releaseAt: Date.now(),
    };
  },
});

export const finalizeRelease = internalMutation({
  args: {
    game: gameIdValidator,
    version: v.number(),
    releaseAt: v.number(),
    catalogUrl: v.string(),
    catalogSha256: v.string(),
    catalogObjectKey: v.string(),
    catalogSchemaVersion: v.number(),
    cardCount: v.optional(v.number()),
  },
  returns: v.object({
    version: v.number(),
    cardCount: v.number(),
    previousVersion: v.union(v.number(), v.null()),
    catalogUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const { galleryCount } = await runCatalogAggregateRefresh(ctx, args.game);
    const cardCount = args.cardCount ?? galleryCount;
    // Default game falls back to the legacy untagged row; patching it tags it with `game`.
    const existing = await getCardDataVersionDoc(ctx, args.game);
    const previousVersion = existing?.version ?? null;

    const fields = {
      version: args.version,
      updatedAt: args.releaseAt,
      cardCount,
      catalogUrl: args.catalogUrl,
      catalogSha256: args.catalogSha256,
      catalogObjectKey: args.catalogObjectKey,
      catalogSchemaVersion: args.catalogSchemaVersion,
      game: args.game,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("cardDataVersion", fields);
    }

    await ctx.scheduler.runAfter(0, internal.catalogRelease.cleanupOldCatalogBlobs, {
      game: args.game,
      keepLatest: CATALOG_VERSIONS_TO_RETAIN,
    });

    return {
      version: args.version,
      cardCount,
      previousVersion,
      catalogUrl: args.catalogUrl,
    };
  },
});

/** Deletes the catalog blob that fell out of the retention window, for this game only. */
export const cleanupOldCatalogBlobs = internalMutation({
  args: {
    game: gameIdValidator,
    keepLatest: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const versionDoc = await getCardDataVersionDoc(ctx, args.game);
    if (!versionDoc) return null;
    const versionToDelete = versionDoc.version - args.keepLatest;
    for (const objectKey of catalogObjectKeysToDelete(args.game, versionToDelete)) {
      await ctx.scheduler.runAfter(0, internal.catalogPublish.deleteCatalogObject, { objectKey });
    }
    return null;
  },
});

/** Publishes a catalog without an auth check: callers (the public action, ops CLI) authorize. */
export const releaseCatalogInternal = internalAction({
  args: { game: gameIdValidator },
  returns: releaseResultValidator,
  handler: async (ctx, args): Promise<{
    version: number;
    cardCount: number;
    previousVersion: number | null;
    catalogUrl: string;
  }> => {
    const prepared: {
      nextVersion: number;
      previousVersion: number | null;
      releaseAt: number;
    } = await ctx.runQuery(internal.catalogRelease.prepareRelease, { game: args.game });

    const uploaded: {
      catalogUrl: string;
      catalogSha256: string;
      catalogObjectKey: string;
      catalogSchemaVersion: number;
      cardCount: number;
    } = await ctx.runAction(internal.catalogPublish.uploadCatalogBlob, {
      game: args.game,
      version: prepared.nextVersion,
      releaseAt: prepared.releaseAt,
    });

    const finalized: {
      version: number;
      cardCount: number;
      previousVersion: number | null;
      catalogUrl: string;
    } = await ctx.runMutation(internal.catalogRelease.finalizeRelease, {
      game: args.game,
      version: prepared.nextVersion,
      releaseAt: prepared.releaseAt,
      catalogUrl: uploaded.catalogUrl,
      catalogSha256: uploaded.catalogSha256,
      catalogObjectKey: uploaded.catalogObjectKey,
      catalogSchemaVersion:
        uploaded.catalogSchemaVersion || CATALOG_STATIC_SCHEMA_VERSION,
      cardCount: uploaded.cardCount,
    });
    return finalized;
  },
});

export const releaseCatalog = action({
  args: { game: v.optional(gameIdValidator) },
  returns: releaseResultValidator,
  handler: async (ctx, args): Promise<{
    version: number;
    cardCount: number;
    previousVersion: number | null;
    catalogUrl: string;
  }> => {
    const result: {
      version: number;
      cardCount: number;
      previousVersion: number | null;
      catalogUrl: string;
    } = await (async () => {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("Not authenticated");
      }
      await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });
      return await ctx.runAction(internal.catalogRelease.releaseCatalogInternal, { game: resolveGame(args.game) });
    })();
    return result;
  },
});
