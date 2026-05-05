import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireCapability } from "./teams/permissions";
import { requireAdmin } from "./utils/validation";

export const generateTeamLogoUploadUrl = mutation({
  args: { teamId: v.id("teams") },
  returns: v.object({ uploadUrl: v.string() }),
  handler: async (ctx, args) => {
    await requireCapability(ctx, args.teamId, "edit_team_settings");
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

export const getPendingTeamLogoAssetForModeration = internalQuery({
  args: { assetId: v.id("mediaAssets") },
  returns: v.union(v.object({ storageId: v.id("_storage") }), v.null()),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.kind !== "team_logo" || asset.status !== "pending") {
      return null;
    }
    return { storageId: asset.storageId };
  },
});

export const submitTeamLogoUpload = mutation({
  args: { teamId: v.id("teams"), storageId: v.id("_storage") },
  returns: v.id("mediaAssets"),
  handler: async (ctx, args) => {
    const { userId } = await requireCapability(ctx, args.teamId, "edit_team_settings");
    const meta = await ctx.db.system.get("_storage", args.storageId);
    if (!meta) {
      throw new Error("Upload not found");
    }
    const now = Date.now();
    const assetId = await ctx.db.insert("mediaAssets", {
      kind: "team_logo",
      teamId: args.teamId,
      storageId: args.storageId,
      uploadedByUserId: userId,
      status: "pending",
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.mediaAssetActions.runTeamLogoModeration, { assetId });
    return assetId;
  },
});

export const finalizeTeamLogoModeration = internalMutation({
  args: {
    assetId: v.id("mediaAssets"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("needs_review"),
    ),
    moderationProvider: v.string(),
    moderationResult: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.kind !== "team_logo" || !asset.teamId) {
      throw new Error("Bad asset");
    }
    if (asset.status !== "pending") {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(args.assetId, {
      status: args.status,
      resolvedAt: now,
      moderationProvider: args.moderationProvider,
      moderationResult: args.moderationResult,
    });
    if (args.status === "approved") {
      const team = await ctx.db.get(asset.teamId);
      if (team) {
        await ctx.db.patch(team._id, { logoAssetId: args.assetId, updatedAt: now });
      }
    }
    return null;
  },
});

const mediaAssetReviewRow = v.object({
  _id: v.id("mediaAssets"),
  kind: v.union(v.literal("team_logo"), v.literal("profile_avatar")),
  teamId: v.optional(v.id("teams")),
  userId: v.optional(v.id("users")),
  createdAt: v.number(),
  resolvedAt: v.optional(v.number()),
  moderationProvider: v.optional(v.string()),
  previewUrl: v.union(v.string(), v.null()),
  teamName: v.union(v.string(), v.null()),
});

type MediaAssetReviewRow = {
  _id: Id<"mediaAssets">;
  kind: "team_logo" | "profile_avatar";
  teamId: Id<"teams"> | undefined;
  userId: Id<"users"> | undefined;
  createdAt: number;
  resolvedAt: number | undefined;
  moderationProvider: string | undefined;
  previewUrl: string | null;
  teamName: string | null;
};

export const listMediaAssetsNeedingReview = query({
  args: {},
  returns: v.array(mediaAssetReviewRow),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const assets = await ctx.db
      .query("mediaAssets")
      .withIndex("by_status", (q) => q.eq("status", "needs_review"))
      .order("desc")
      .collect();
    const result: MediaAssetReviewRow[] = [];
    for (const a of assets) {
      const previewUrl = (await ctx.storage.getUrl(a.storageId)) ?? null;
      let teamName: string | null = null;
      if (a.teamId) {
        const team = await ctx.db.get(a.teamId);
        teamName = team?.name ?? null;
      }
      result.push({
        _id: a._id,
        kind: a.kind,
        teamId: a.teamId,
        userId: a.userId,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
        moderationProvider: a.moderationProvider,
        previewUrl,
        teamName,
      });
    }
    return result;
  },
});

export const approveMediaAssetReview = mutation({
  args: { assetId: v.id("mediaAssets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.status !== "needs_review") {
      throw new Error("Not in review queue");
    }
    const now = Date.now();
    await ctx.db.patch(args.assetId, {
      status: "approved",
      reviewedAt: now,
      reviewerUserId: adminId,
    });
    if (asset.kind === "team_logo" && asset.teamId) {
      const team = await ctx.db.get(asset.teamId);
      if (team) {
        await ctx.db.patch(team._id, { logoAssetId: args.assetId, updatedAt: now });
      }
    }
    return null;
  },
});

export const rejectMediaAssetReview = mutation({
  args: { assetId: v.id("mediaAssets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.status !== "needs_review") {
      throw new Error("Not in review queue");
    }
    const now = Date.now();
    await ctx.db.patch(args.assetId, {
      status: "rejected",
      reviewedAt: now,
      reviewerUserId: adminId,
    });
    return null;
  },
});
