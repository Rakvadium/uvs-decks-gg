import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { tierListCommentStatusValidator } from "./validators";
import { requireUserCanPostContent } from "./utils/validation";

export const assertPublicTierListCommentActor = internalQuery({
  args: {
    tierListId: v.id("tierLists"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tierList = await ctx.db.get(args.tierListId);
    if (!tierList) {
      throw new Error("Tier list not found");
    }
    if (!tierList.isPublic) {
      throw new Error("Not a public tier list");
    }
    return null;
  },
});

export const insertTierListComment = internalMutation({
  args: {
    tierListId: v.id("tierLists"),
    userId: v.id("users"),
    content: v.string(),
    status: tierListCommentStatusValidator,
    moderationReason: v.optional(v.string()),
    textModerationProvider: v.optional(v.string()),
    textModerationResult: v.optional(v.any()),
  },
  returns: v.object({
    status: tierListCommentStatusValidator,
    moderationReason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireUserCanPostContent(ctx, args.userId);
    const tierList = await ctx.db.get(args.tierListId);
    if (!tierList) {
      throw new Error("Tier list not found");
    }
    const now = Date.now();
    await ctx.db.insert("tierListComments", {
      tierListId: args.tierListId,
      userId: args.userId,
      content: args.content,
      status: args.status,
      createdAt: now,
      updatedAt: now,
      ...(args.moderationReason ? { moderationReason: args.moderationReason } : {}),
      ...(args.textModerationProvider ? { textModerationProvider: args.textModerationProvider } : {}),
      ...(args.textModerationResult !== undefined ? { textModerationResult: args.textModerationResult } : {}),
    });
    if (args.status === "approved") {
      await ctx.db.patch(args.tierListId, {
        commentCount: tierList.commentCount + 1,
      });
    }
    return {
      status: args.status,
      ...(args.moderationReason ? { moderationReason: args.moderationReason } : {}),
    };
  },
});
