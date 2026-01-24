import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { cardValidator, collectionEntryValidator } from "./validators";
import { requireAuth } from "./utils/validation";

export const listByUser = query({
  args: {
    userId: v.id("users"),
    search: v.optional(v.string()),
    rarity: v.optional(v.array(v.string())),
    set: v.optional(v.array(v.string())),
  },
  returns: v.array(
    v.object({
      _id: v.id("collections"),
      _creationTime: v.number(),
      userId: v.id("users"),
      cardId: v.id("cards"),
      quantity: v.number(),
      condition: v.optional(v.string()),
      isFoil: v.optional(v.boolean()),
      card: v.union(cardValidator, v.null()),
    })
  ),
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const entriesWithCards = await Promise.all(
      entries.map(async (entry) => {
        const card = await ctx.db.get(entry.cardId);
        return { ...entry, card };
      })
    );

    let filtered = entriesWithCards.filter(
      (entry) => entry.card && entry.card.isFrontFace !== false
    );

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.card && entry.card.name.toLowerCase().includes(searchLower)
      );
    }

    if (args.rarity && args.rarity.length > 0) {
      filtered = filtered.filter(
        (entry) =>
          entry.card && entry.card.rarity && args.rarity!.includes(entry.card.rarity)
      );
    }

    if (args.set && args.set.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.card?.setCode && args.set!.includes(entry.card.setCode)
      );
    }

    return filtered;
  },
});

export const getByUserAndCard = query({
  args: {
    userId: v.id("users"),
    cardId: v.id("cards"),
  },
  returns: v.union(collectionEntryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_user_and_card", (q) =>
        q.eq("userId", args.userId).eq("cardId", args.cardId)
      )
      .first();
  },
});

export const addToCollection = mutation({
  args: {
    cardId: v.id("cards"),
    quantity: v.optional(v.number()),
    condition: v.optional(v.string()),
    isFoil: v.optional(v.boolean()),
  },
  returns: v.id("collections"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    if (card.isFrontFace === false) {
      throw new Error("Cannot add back-face card to collection. Add the front face instead.");
    }

    const existing = await ctx.db
      .query("collections")
      .withIndex("by_user_and_card", (q) =>
        q.eq("userId", userId).eq("cardId", args.cardId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + (args.quantity ?? 1),
      });
      return existing._id;
    }

    return await ctx.db.insert("collections", {
      userId,
      cardId: args.cardId,
      quantity: args.quantity ?? 1,
      condition: args.condition,
      isFoil: args.isFoil,
    });
  },
});

export const updateQuantity = mutation({
  args: {
    collectionId: v.id("collections"),
    quantity: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const entry = await ctx.db.get(args.collectionId);
    if (!entry) throw new Error("Collection entry not found");
    if (entry.userId !== userId) throw new Error("Not authorized");

    if (args.quantity <= 0) {
      await ctx.db.delete(args.collectionId);
    } else {
      await ctx.db.patch(args.collectionId, { quantity: args.quantity });
    }
    return null;
  },
});

export const removeFromCollection = mutation({
  args: {
    collectionId: v.id("collections"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const entry = await ctx.db.get(args.collectionId);
    if (!entry) throw new Error("Collection entry not found");
    if (entry.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.collectionId);
    return null;
  },
});

export const getCollectionStats = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    totalCards: v.number(),
    uniqueCards: v.number(),
    byRarity: v.record(v.string(), v.number()),
    bySet: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let totalCards = 0;
    const byRarity: Record<string, number> = {};
    const bySet: Record<string, number> = {};

    for (const entry of entries) {
      totalCards += entry.quantity;
      const card = await ctx.db.get(entry.cardId);
      if (card && card.isFrontFace !== false) {
        if (card.rarity) {
          byRarity[card.rarity] = (byRarity[card.rarity] ?? 0) + entry.quantity;
        }
        if (card.setCode) {
          bySet[card.setCode] = (bySet[card.setCode] ?? 0) + entry.quantity;
        }
      }
    }

    return {
      totalCards,
      uniqueCards: entries.length,
      byRarity,
      bySet,
    };
  },
});
