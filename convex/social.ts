import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const likeDeck = mutation({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("deckLikes")
      .withIndex("by_user_and_deck", (q) =>
        q.eq("userId", userId).eq("deckId", args.deckId)
      )
      .unique();

    if (existing) {
      return null;
    }

    await ctx.db.insert("deckLikes", {
      userId,
      deckId: args.deckId,
    });

    return null;
  },
});

export const unlikeDeck = mutation({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("deckLikes")
      .withIndex("by_user_and_deck", (q) =>
        q.eq("userId", userId).eq("deckId", args.deckId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});

export const hasUserLikedDeck = query({
  args: {
    userId: v.id("users"),
    deckId: v.id("decks"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deckLikes")
      .withIndex("by_user_and_deck", (q) =>
        q.eq("userId", args.userId).eq("deckId", args.deckId)
      )
      .unique();

    return existing !== null;
  },
});

export const getDeckLikeCount = query({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("deckLikes")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    return likes.length;
  },
});

export const getUserLikedDecks = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.id("decks")),
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("deckLikes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return likes.map((like) => like.deckId);
  },
});

export const recordDeckView = mutation({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("deckViews")
      .withIndex("by_user_and_deck", (q) =>
        q.eq("userId", userId).eq("deckId", args.deckId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        viewedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("deckViews", {
        userId,
        deckId: args.deckId,
        viewedAt: Date.now(),
      });
    }

    return null;
  },
});

export const getDeckViewCount = query({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("deckViews")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    return views.length;
  },
});

export const hasUserViewedDeck = query({
  args: {
    userId: v.id("users"),
    deckId: v.id("decks"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deckViews")
      .withIndex("by_user_and_deck", (q) =>
        q.eq("userId", args.userId).eq("deckId", args.deckId)
      )
      .unique();

    return existing !== null;
  },
});

export const followUser = mutation({
  args: {
    followingId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const followerId = await getAuthUserId(ctx);
    if (!followerId) throw new Error("Not authenticated");

    if (followerId === args.followingId) {
      throw new Error("Cannot follow yourself");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", followerId).eq("followingId", args.followingId)
      )
      .unique();

    if (existing) {
      return null;
    }

    await ctx.db.insert("follows", {
      followerId,
      followingId: args.followingId,
    });

    return null;
  },
});

export const unfollowUser = mutation({
  args: {
    followingId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const followerId = await getAuthUserId(ctx);
    if (!followerId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", followerId).eq("followingId", args.followingId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});

export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();

    return existing !== null;
  },
});

export const getFollowerCount = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    return followers.length;
  },
});

export const getFollowingCount = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return following.length;
  },
});

export const getFollowers = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.id("users")),
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    return followers.map((f) => f.followerId);
  },
});

export const getFollowing = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.id("users")),
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return following.map((f) => f.followingId);
  },
});

export const getDeckStats = query({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.object({
    likeCount: v.number(),
    viewCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("deckLikes")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    const views = await ctx.db
      .query("deckViews")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    return {
      likeCount: likes.length,
      viewCount: views.length,
    };
  },
});

export const getUserStats = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    followerCount: v.number(),
    followingCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return {
      followerCount: followers.length,
      followingCount: following.length,
    };
  },
});
