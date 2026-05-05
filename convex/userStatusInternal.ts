import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { effectiveAccountStatus, userCanPostContent } from "./lib/accountStatus";

export const assertUserCanPostAt = internalQuery({
  args: {
    userId: v.id("users"),
    at: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    const st = effectiveAccountStatus(user, args.at);
    if (!userCanPostContent(st)) {
      throw new Error("This account is restricted from creating or editing content.");
    }
    return null;
  },
});
