import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { teamChatMessageValidator } from "../validators";
import { isPublishTextModerationEnabled } from "../lib/moderation/textPublish";
import { getTeamViewerOrNull, hasCapability, requireCapability } from "./permissions";
import { requireUserCanPostContent } from "../utils/validation";

const messageWithAuthorValidator = v.object({
  message: teamChatMessageValidator,
  authorUsername: v.optional(v.string()),
});

export const listPage = query({
  args: {
    teamId: v.id("teams"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(messageWithAuthorValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const viewer = await getTeamViewerOrNull(ctx, args.teamId);
    if (!viewer) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    const numItems = Math.min(Math.max(args.paginationOpts.numItems, 1), 50);
    const result = await ctx.db
      .query("teamChatMessages")
      .withIndex("by_teamId_and_createdAt", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .paginate({ numItems, cursor: args.paginationOpts.cursor });
    const page: Array<{
      message: (typeof result.page)[0];
      authorUsername?: string;
    }> = [];
    for (const message of result.page) {
      const u = await ctx.db.get(message.authorUserId);
      page.push({
        message,
        authorUsername: u?.username ?? undefined,
      });
    }
    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const createMessage = mutation({
  args: {
    teamId: v.id("teams"),
    body: v.string(),
  },
  returns: v.id("teamChatMessages"),
  handler: async (ctx, args) => {
    const { userId } = await requireCapability(ctx, args.teamId, "post_team_chat");
    await requireUserCanPostContent(ctx, userId);
    if (isPublishTextModerationEnabled()) {
      throw new Error(
        "Team chat uses api.publishTeamChatMessage.submitTeamChatMessage when publish-time text moderation is enabled in Convex."
      );
    }
    const text = args.body.trim();
    if (text.length === 0) {
      throw new Error("Message cannot be empty");
    }
    if (text.length > 8000) {
      throw new Error("Message is too long");
    }
    const now = Date.now();
    return await ctx.db.insert("teamChatMessages", {
      teamId: args.teamId,
      authorUserId: userId,
      body: text,
      createdAt: now,
    });
  },
});

export const updateMessage = mutation({
  args: {
    messageId: v.id("teamChatMessages"),
    body: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.messageId);
    if (!row) {
      throw new Error("Message not found");
    }
    const { userId } = await requireCapability(ctx, row.teamId, "post_team_chat");
    await requireUserCanPostContent(ctx, userId);
    if (row.authorUserId !== userId) {
      throw new Error("You can only edit your own messages");
    }
    const text = args.body.trim();
    if (text.length === 0) {
      throw new Error("Message cannot be empty");
    }
    if (text.length > 8000) {
      throw new Error("Message is too long");
    }
    await ctx.db.patch(args.messageId, { body: text });
    return null;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("teamChatMessages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.messageId);
    if (!row) {
      throw new Error("Message not found");
    }
    const viewer = await getTeamViewerOrNull(ctx, row.teamId);
    if (!viewer) {
      throw new Error("Not a team member");
    }
    const { userId, role } = viewer;
    if (row.authorUserId === userId) {
      await requireUserCanPostContent(ctx, userId);
      await ctx.db.delete(args.messageId);
      return null;
    }
    if (!hasCapability(role, "moderate_team_chat")) {
      throw new Error("You cannot delete this message");
    }
    await ctx.db.delete(args.messageId);
    return null;
  },
});
