/**
 * One-time auth handoff codes: the apex (signed in) mints a code for an allowed game origin;
 * the game host redeems it through the `handoff` ConvexCredentials provider (convex/auth.ts).
 * See docs/multi-game.md "Central auth host (handoff)".
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import {
  buildHandoffCallbackUrl,
  checkHandoffCode,
  HANDOFF_CODE_TTL_MS,
  isValidHandoffCode,
  isValidHandoffState,
  parseHandoffReturnUrl,
  randomToken,
  sha256Hex,
} from "../shared/auth-handoff";
import { isAllowedHandoffOrigin } from "../shared/hosts";

const handoffRateLimiter = new RateLimiter(components.rateLimiter, {
  authHandoffCreate: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },
  // Codes are 256-bit random, so this only bounds noisy failures per origin.
  authHandoffConsumeFailure: { kind: "token bucket", rate: 120, period: MINUTE, capacity: 120 },
});

const CLEANUP_BATCH = 200;

export const create = mutation({
  args: { returnUrl: v.string(), state: v.optional(v.string()) },
  returns: v.object({ code: v.string(), redirectUrl: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const target = parseHandoffReturnUrl(args.returnUrl);
    if (!target) {
      throw new ConvexError("Invalid return URL");
    }
    if (args.state !== undefined && !isValidHandoffState(args.state)) {
      throw new ConvexError("Invalid state");
    }
    await handoffRateLimiter.limit(ctx, "authHandoffCreate", { key: userId, throws: true });

    const code = randomToken(32);
    const now = Date.now();
    await ctx.db.insert("authHandoffCodes", {
      codeHash: await sha256Hex(code),
      userId,
      origin: target.origin,
      state: args.state,
      expiresAt: now + HANDOFF_CODE_TTL_MS,
    });
    return {
      code,
      redirectUrl: buildHandoffCallbackUrl(target.origin, {
        code,
        state: args.state,
        next: target.path,
      }),
    };
  },
});

/** Redeem a code for `origin`. Single use; returns the user id or null. */
export const consume = internalMutation({
  args: { code: v.string(), origin: v.string() },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    if (!isValidHandoffCode(args.code) || !isAllowedHandoffOrigin(args.origin)) {
      return null;
    }
    const failureKey = args.origin;
    const budget = await handoffRateLimiter.check(ctx, "authHandoffConsumeFailure", {
      key: failureKey,
    });
    if (!budget.ok) {
      return null;
    }
    const codeHash = await sha256Hex(args.code);
    const record = await ctx.db
      .query("authHandoffCodes")
      .withIndex("by_codeHash", (q) => q.eq("codeHash", codeHash))
      .unique();
    const now = Date.now();
    const result = checkHandoffCode(record, args.origin, now);
    if (result !== "ok" || !record) {
      if (record && result !== "used") {
        // Burn codes presented to the wrong origin or after expiry.
        await ctx.db.patch(record._id, { usedAt: now });
      }
      await handoffRateLimiter.limit(ctx, "authHandoffConsumeFailure", { key: failureKey });
      return null;
    }
    await ctx.db.patch(record._id, { usedAt: now });
    const user = await ctx.db.get(record.userId);
    return user ? record.userId : null;
  },
});

/** Delete expired codes (cron). */
export const cleanupExpired = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("authHandoffCodes")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", Date.now()))
      .take(CLEANUP_BATCH);
    for (const row of expired) {
      await ctx.db.delete(row._id);
    }
    return null;
  },
});

/** Delete every session (and its refresh tokens) of the current user. */
export const signOutEverywhere = mutation({
  args: {},
  returns: v.object({ sessions: v.number() }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }
    return { sessions: sessions.length };
  },
});
