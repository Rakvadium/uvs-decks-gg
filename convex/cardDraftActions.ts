"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { r2 } from "./r2";

function sanitizeKeySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const runDraftOcr = internalAction({
  args: {
    draftId: v.id("cardDrafts"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const draft = await ctx.runQuery(internal.cardDrafts.getDraftForOcr, {
      draftId: args.draftId,
    });
    if (!draft) {
      return null;
    }
    await ctx.runMutation(internal.cardDrafts.applyDraftOcr, {
      draftId: args.draftId,
      ocrRawText: "",
      draft: {},
      parseWarnings: ["Server OCR is disabled; use Re-run OCR in the review page"],
      detectedType: draft.detectedType,
    });
    return null;
  },
});

export const approveDraft = action({
  args: {
    draftId: v.id("cardDrafts"),
  },
  returns: v.id("cards"),
  handler: async (ctx, args): Promise<Id<"cards">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });
    const draft = await ctx.runQuery(internal.cardDrafts.getDraftForApproval, {
      draftId: args.draftId,
    });
    if (!draft) {
      throw new Error("Draft not found");
    }
    const blob = await ctx.storage.get(draft.imageStorageId);
    if (!blob) {
      throw new Error("Stored draft image was not found");
    }
    const setSegment = sanitizeKeySegment(draft.setCode);
    const collectorSegment = sanitizeKeySegment(
      draft.draft.collectorNumber ?? draft.collectorNumber ?? draft.fileName.replace(/\.[^.]+$/, "")
    );
    if (!setSegment || !collectorSegment) {
      throw new Error("Set code and collector number are required before approval");
    }
    const relativeKey = `${setSegment}/${collectorSegment}.webp`;
    const objectKey = `cards/${relativeKey}`;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await r2.store(ctx, bytes, {
      key: objectKey,
      type: blob.type || "image/webp",
    });
    try {
      return await ctx.runMutation(internal.cardDrafts.finalizeApproveDraft, {
        draftId: args.draftId,
        imageUrl: relativeKey,
        reviewerUserId: userId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not approve draft";
      await ctx.runMutation(internal.cardDrafts.markApprovalError, {
        draftId: args.draftId,
        message,
      });
      throw error;
    }
  },
});
