import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { r2 } from "./r2";

function sanitizeKeySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const uploadCardImage = action({
  args: {
    setCode: v.string(),
    fileName: v.string(),
    bytes: v.bytes(),
    contentType: v.optional(v.string()),
  },
  returns: v.object({ key: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });

    const setSegment = sanitizeKeySegment(args.setCode);
    const fileSegment = sanitizeKeySegment(args.fileName.replace(/\.webp$/i, ""));
    if (!setSegment) {
      throw new Error("A set code is required to upload an image");
    }
    if (!fileSegment) {
      throw new Error("A collector number or file name is required to upload an image");
    }

    const relativeKey = `${setSegment}/${fileSegment}.webp`;
    const objectKey = `cards/${relativeKey}`;
    const bytes = new Uint8Array(args.bytes);

    await r2.store(ctx, bytes, {
      key: objectKey,
      type: args.contentType ?? "image/webp",
    });

    return { key: relativeKey };
  },
});
