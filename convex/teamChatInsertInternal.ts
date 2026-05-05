import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { requireUserCanPostContent } from "./utils/validation";

export const insertTeamChatMessage = internalMutation({
  args: {
    teamId: v.id("teams"),
    authorUserId: v.id("users"),
    body: v.string(),
    textModerationProvider: v.optional(v.string()),
    textModerationResult: v.optional(v.any()),
  },
  returns: v.id("teamChatMessages"),
  handler: async (ctx, args) => {
    await requireUserCanPostContent(ctx, args.authorUserId);
    const now = Date.now();
    return await ctx.db.insert("teamChatMessages", {
      teamId: args.teamId,
      authorUserId: args.authorUserId,
      body: args.body,
      createdAt: now,
      ...(args.textModerationProvider ? { textModerationProvider: args.textModerationProvider } : {}),
      ...(args.textModerationResult !== undefined ? { textModerationResult: args.textModerationResult } : {}),
    });
  },
});
