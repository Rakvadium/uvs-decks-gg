import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { moderateImage } from "./lib/moderation/providers";

export const runTeamLogoModeration = internalAction({
  args: { assetId: v.id("mediaAssets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.runQuery(internal.mediaAssets.getPendingTeamLogoAssetForModeration, {
      assetId: args.assetId,
    });
    if (!row) {
      return null;
    }
    const blob = await ctx.storage.get(row.storageId);
    if (!blob) {
      await ctx.runMutation(internal.mediaAssets.finalizeTeamLogoModeration, {
        assetId: args.assetId,
        status: "needs_review",
        moderationProvider: "storage",
        moderationResult: {
          error: "Stored upload missing",
          assetId: args.assetId,
        },
      });
      return null;
    }
    const bytes = await blob.arrayBuffer();
    const verdict = await moderateImage(bytes, {
      kind: "team_logo",
      assetId: args.assetId,
    });
    await ctx.runMutation(internal.mediaAssets.finalizeTeamLogoModeration, {
      assetId: args.assetId,
      status: verdict.decision,
      moderationProvider: verdict.provider,
      moderationResult: verdict.raw,
    });
    return null;
  },
});
