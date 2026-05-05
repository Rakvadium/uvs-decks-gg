import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const runExpireStaleStatuses = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const result = await ctx.db
      .query("users")
      .order("asc")
      .paginate({ numItems: 200, cursor: args.cursor ?? null });
    for (const u of result.page) {
      if (u.statusExpiresAt !== undefined && u.statusExpiresAt <= now) {
        await ctx.db.patch(u._id, {
          accountStatus: "active",
          statusExpiresAt: undefined,
          statusReason: undefined,
          userFacingMessage: undefined,
          statusSetAt: undefined,
          statusSetBy: undefined,
        });
      }
    }
    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.accountStatusExpiry.runExpireStaleStatuses, {
        cursor: result.continueCursor,
      });
    }
    return null;
  },
});
