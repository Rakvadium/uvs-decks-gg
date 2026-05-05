import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { moderateCommentLocal } from "./lib/moderation/localCommentHeuristic";
import {
  evaluatePublishText,
  isPublishTextModerationEnabled,
  mergeLocalAndApiModeration,
} from "./lib/moderation/textPublish";

async function handleSubmitTeamChatMessage(
  ctx: ActionCtx,
  args: { teamId: Id<"teams">; body: string }
): Promise<Id<"teamChatMessages">> {
  const { internal } = await import("./_generated/api");
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  if (!isPublishTextModerationEnabled()) {
    throw new Error("Publish-time text moderation is not enabled");
  }
  await ctx.runQuery(internal.userStatusInternal.assertUserCanPostAt, {
    userId,
    at: Date.now(),
  });
  await ctx.runQuery(internal.teams.permissions.assertUserCanPostTeamChat, {
    userId,
    teamId: args.teamId,
  });
  const text = args.body.trim();
  if (text.length === 0) {
    throw new Error("Message cannot be empty");
  }
  if (text.length > 8000) {
    throw new Error("Message is too long");
  }
  const local = moderateCommentLocal(text);
  const apiResult = await evaluatePublishText(text, { surface: "team_chat" });
  const merged = mergeLocalAndApiModeration({ local, api: apiResult });
  if (merged.status !== "approved") {
    throw new Error(merged.moderationReason ?? "Message did not pass content review");
  }
  return await ctx.runMutation(internal.teamChatInsertInternal.insertTeamChatMessage, {
    teamId: args.teamId,
    authorUserId: userId,
    body: text,
    ...(merged.textModerationProvider ? { textModerationProvider: merged.textModerationProvider } : {}),
    ...(merged.textModerationResult !== undefined
      ? { textModerationResult: merged.textModerationResult }
      : {}),
  });
}

export const submitTeamChatMessage = action({
  args: {
    teamId: v.id("teams"),
    body: v.string(),
  },
  returns: v.id("teamChatMessages"),
  handler: handleSubmitTeamChatMessage,
});
