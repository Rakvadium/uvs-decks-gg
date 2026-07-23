"use node";

import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

async function loadImageBuffer(args: {
  bytes?: ArrayBuffer;
  imageUrl?: string;
}): Promise<Buffer> {
  if (args.bytes) {
    return Buffer.from(args.bytes);
  }
  if (!args.imageUrl) {
    throw new Error("Provide either bytes or imageUrl");
  }
  const response = await fetch(args.imageUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch image (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export const extractText = action({
  args: {
    bytes: v.optional(v.bytes()),
    imageUrl: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.object({
    text: v.string(),
    confidence: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (Boolean(args.bytes) === Boolean(args.imageUrl)) {
      throw new Error("Provide exactly one of bytes or imageUrl");
    }

    await loadImageBuffer({
      bytes: args.bytes,
      imageUrl: args.imageUrl,
    });
    throw new Error("Server OCR is disabled; use browser OCR from the admin review page");
  },
});
