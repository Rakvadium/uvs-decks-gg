import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { deckShareEntryValidator } from "./validators";
import { requireAuth, requireUserCanPostContent } from "./utils/validation";
import { normalizeDeckVisibility } from "./lib/deckAccess";

export const listForDeck = query({
  args: { deckId: v.id("decks") },
  returns: v.array(deckShareEntryValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) return [];

    const rows = await ctx.db
      .query("deckShares")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    const out: Array<{
      _id: (typeof rows)[0]["_id"];
      userId: (typeof rows)[0]["userId"];
      status: (typeof rows)[0]["status"];
      username?: string;
      image?: string;
      createdAt: number;
    }> = [];

    for (const row of rows) {
      const u = await ctx.db.get(row.userId);
      out.push({
        _id: row._id,
        userId: row.userId,
        status: row.status,
        username: u?.username,
        image: u?.image,
        createdAt: row.createdAt,
      });
    }

    return out;
  },
});

export const getPendingInvitePreview = query({
  args: { deckId: v.id("decks") },
  returns: v.union(v.null(), v.object({ deckName: v.string() })),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const deck = await ctx.db.get(args.deckId);
    if (!deck || normalizeDeckVisibility(deck) !== "share") return null;

    const share = await ctx.db
      .query("deckShares")
      .withIndex("by_deck_and_user", (q) => q.eq("deckId", args.deckId).eq("userId", userId))
      .first();

    if (!share || share.status !== "pending") return null;
    return { deckName: deck.name };
  },
});

export const inviteUser = mutation({
  args: {
    deckId: v.id("decks"),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireUserCanPostContent(ctx, userId);
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) throw new Error("Not authorized");
    if (normalizeDeckVisibility(deck) !== "share") {
      throw new Error("Deck is not in share mode");
    }

    const needle = args.username.trim().toLowerCase();
    if (!needle) throw new Error("Username required");

    const users = await ctx.db.query("users").collect();
    const invitee = users.find((u) => u.username?.toLowerCase() === needle);
    if (!invitee) throw new Error("User not found");
    if (invitee._id === userId) throw new Error("Cannot invite yourself");
    if (invitee._id === deck.userId) throw new Error("Invalid invite");

    const existing = await ctx.db
      .query("deckShares")
      .withIndex("by_deck_and_user", (q) =>
        q.eq("deckId", args.deckId).eq("userId", invitee._id),
      )
      .first();

    const now = Date.now();
    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("User already has access");
      }
      await ctx.db.patch(existing._id, { status: "pending", invitedBy: userId, createdAt: now });
      return null;
    }

    await ctx.db.insert("deckShares", {
      deckId: args.deckId,
      userId: invitee._id,
      status: "pending",
      invitedBy: userId,
      createdAt: now,
    });
    return null;
  },
});

export const acceptInvite = mutation({
  args: { deckId: v.id("decks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireUserCanPostContent(ctx, userId);
    const deck = await ctx.db.get(args.deckId);
    if (!deck || normalizeDeckVisibility(deck) !== "share") throw new Error("Not available");

    const share = await ctx.db
      .query("deckShares")
      .withIndex("by_deck_and_user", (q) => q.eq("deckId", args.deckId).eq("userId", userId))
      .first();

    if (!share || share.status !== "pending") throw new Error("No pending invite");
    await ctx.db.patch(share._id, { status: "accepted" });
    return null;
  },
});

export const revokeUser = mutation({
  args: {
    deckId: v.id("decks"),
    targetUserId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireUserCanPostContent(ctx, userId);
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) throw new Error("Not authorized");

    const share = await ctx.db
      .query("deckShares")
      .withIndex("by_deck_and_user", (q) =>
        q.eq("deckId", args.deckId).eq("userId", args.targetUserId),
      )
      .first();

    if (share) await ctx.db.delete(share._id);
    return null;
  },
});
