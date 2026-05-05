import { query, mutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { buildAdminSearchText } from "./lib/accountStatus";
import { publicUserFromDocument, userValidator, currentUserSelfValidator } from "./validators";
import { requireUserCanUpdateProfile } from "./utils/validation";

export const currentUser = query({
  args: {},
  returns: v.union(currentUserSelfValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const base = publicUserFromDocument(user);
    return {
      ...base,
      accountStatus: (user.accountStatus ?? "active") as
        | "active"
        | "suspended"
        | "banned"
        | "write_restricted",
      statusExpiresAt: user.statusExpiresAt,
      userFacingMessage: user.userFacingMessage,
    };
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  returns: v.union(userValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user ? publicUserFromDocument(user) : null;
  },
});

export const isAdminForUserId = internalQuery({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user !== null && user.role === "Admin";
  },
});

export const updateProfile = mutation({
  args: {
    username: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await requireUserCanUpdateProfile(ctx, userId);

    const updates: { username?: string; image?: string } = {};
    
    if (args.username !== undefined) {
      updates.username = args.username;
    }
    
    if (args.image !== undefined) {
      updates.image = args.image;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
    const u = await ctx.db.get(userId);
    if (u) {
      await ctx.db.patch(userId, {
        adminSearchText: buildAdminSearchText(u),
        hasVerifiedEmail: u.emailVerificationTime !== undefined,
      });
    }

    return null;
  },
});

export const setProfanityFilterEnabled = mutation({
  args: {
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await requireUserCanUpdateProfile(ctx, userId);
    await ctx.db.patch(userId, { profanityFilterEnabled: args.enabled });
    return null;
  },
});
