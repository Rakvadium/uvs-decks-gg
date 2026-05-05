import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { tierListCommentStatusValidator } from "./validators";
import { moderateCommentLocal } from "./lib/moderation/localCommentHeuristic";
import {
  evaluatePublishText,
  isPublishTextModerationEnabled,
  mergeLocalAndApiModeration,
} from "./lib/moderation/textPublish";

function sanitizeCommentContent(raw: string, maxLength: number) {
  const normalized = raw.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, maxLength);
}

async function handleSubmitTierListComment(
  ctx: ActionCtx,
  args: { tierListId: Id<"tierLists">; content: string }
): Promise<{
  status: "approved" | "pending" | "flagged" | "rejected";
  moderationReason?: string;
}> {
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
  await ctx.runQuery(internal.tierListCommentInternal.assertPublicTierListCommentActor, {
    tierListId: args.tierListId,
  });
  const content = sanitizeCommentContent(args.content, 500);
  if (!content) {
    throw new Error("Comment cannot be empty");
  }
  const local = moderateCommentLocal(content);
  const apiResult = await evaluatePublishText(content, { surface: "tier_list_comment" });
  const merged = mergeLocalAndApiModeration({ local, api: apiResult });
  return await ctx.runMutation(internal.tierListCommentInternal.insertTierListComment, {
    tierListId: args.tierListId,
    userId,
    content,
    status: merged.status,
    ...(merged.moderationReason ? { moderationReason: merged.moderationReason } : {}),
    ...(merged.textModerationProvider ? { textModerationProvider: merged.textModerationProvider } : {}),
    ...(merged.textModerationResult !== undefined
      ? { textModerationResult: merged.textModerationResult }
      : {}),
  });
}

export const submitTierListComment = action({
  args: {
    tierListId: v.id("tierLists"),
    content: v.string(),
  },
  returns: v.object({
    status: tierListCommentStatusValidator,
    moderationReason: v.optional(v.string()),
  }),
  handler: handleSubmitTierListComment,
});
