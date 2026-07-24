import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  catalogSyncSessionGlobal: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 15,
    shards: 8,
  },
  catalogSyncSessionSubject: {
    kind: "token bucket",
    rate: 4,
    period: MINUTE,
    capacity: 2,
  },
});

export const claimCatalogSyncBudget = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const subjectKey = identity?.tokenIdentifier ?? "anonymous";
    await rateLimiter.limit(ctx, "catalogSyncSessionGlobal", { throws: true });
    await rateLimiter.limit(ctx, "catalogSyncSessionSubject", {
      key: subjectKey,
      throws: true,
    });
    return null;
  },
});
