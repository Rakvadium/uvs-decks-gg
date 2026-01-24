import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { deckValidator, cardLayoutValidator, deckSectionValidator } from "./validators";
import { requireAuth, requireNotBackFace } from "./utils/validation";

export const listByUser = query({
  args: {
    userId: v.id("users"),
    search: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.array(deckValidator),
  handler: async (ctx, args) => {
    let decks = await ctx.db
      .query("decks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      decks = decks.filter(
        (deck) =>
          deck.name.toLowerCase().includes(searchLower) ||
          (deck.description &&
            deck.description.toLowerCase().includes(searchLower))
      );
    }

    if (args.isPublic !== undefined) {
      decks = decks.filter((deck) => deck.isPublic === args.isPublic);
    }

    return decks;
  },
});

export const listPublic = query({
  args: {
    search: v.optional(v.string()),
  },
  returns: v.array(deckValidator),
  handler: async (ctx, args) => {
    let decks = await ctx.db
      .query("decks")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .collect();

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      decks = decks.filter(
        (deck) =>
          deck.name.toLowerCase().includes(searchLower) ||
          (deck.description?.toLowerCase().includes(searchLower))
      );
    }

    return decks;
  },
});

export const getById = query({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.union(deckValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deckId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    format: v.optional(v.string()),
    startingCharacterId: v.optional(v.id("cards")),
    selectedIdentity: v.optional(v.string()),
  },
  returns: v.id("decks"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.startingCharacterId) {
      await requireNotBackFace(ctx, args.startingCharacterId);
    }

    return await ctx.db.insert("decks", {
      userId,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic ?? false,
      format: args.format,
      startingCharacterId: args.startingCharacterId,
      selectedIdentity: args.selectedIdentity,
      mainCardIds: [],
      mainQuantities: {},
      sideCardIds: [],
      sideQuantities: {},
      referenceCardIds: [],
      referenceQuantities: {},
    });
  },
});

export const update = mutation({
  args: {
    deckId: v.id("decks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    imageCardId: v.optional(v.union(v.id("cards"), v.null())),
    startingCharacterId: v.optional(v.union(v.id("cards"), v.null())),
    selectedIdentity: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    if (deck.userId !== userId) throw new Error("Not authorized");

    if (args.startingCharacterId !== undefined && args.startingCharacterId !== null) {
      await requireNotBackFace(ctx, args.startingCharacterId);
    }

    const { deckId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(deckId, filteredUpdates);
    }
    return null;
  },
});

export const addCard = mutation({
  args: {
    deckId: v.id("decks"),
    cardId: v.id("cards"),
    section: deckSectionValidator,
    quantity: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    if (deck.userId !== userId) throw new Error("Not authorized");

    await requireNotBackFace(ctx, args.cardId);

    const cardIdStr = args.cardId.toString();
    const addQuantity = args.quantity ?? 1;

    const cardIdsKey = `${args.section}CardIds` as const;
    const quantitiesKey = `${args.section}Quantities` as const;

    const currentCardIds = deck[cardIdsKey];
    const currentQuantities = deck[quantitiesKey];
    const currentQuantity = currentQuantities[cardIdStr] ?? 0;

    const newCardIds = currentCardIds.includes(args.cardId)
      ? currentCardIds
      : [...currentCardIds, args.cardId];

    await ctx.db.patch(args.deckId, {
      [cardIdsKey]: newCardIds,
      [quantitiesKey]: {
        ...currentQuantities,
        [cardIdStr]: currentQuantity + addQuantity,
      },
    });

    return null;
  },
});

export const removeCard = mutation({
  args: {
    deckId: v.id("decks"),
    cardId: v.id("cards"),
    section: deckSectionValidator,
    quantity: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    if (deck.userId !== userId) throw new Error("Not authorized");

    const cardIdStr = args.cardId.toString();
    const removeQuantity = args.quantity ?? 1;

    const cardIdsKey = `${args.section}CardIds` as const;
    const quantitiesKey = `${args.section}Quantities` as const;

    const currentCardIds = deck[cardIdsKey];
    const currentQuantities = deck[quantitiesKey];
    const currentQuantity = currentQuantities[cardIdStr] ?? 0;
    const newQuantity = Math.max(0, currentQuantity - removeQuantity);

    const newQuantities = { ...currentQuantities };
    if (newQuantity === 0) {
      delete newQuantities[cardIdStr];
    } else {
      newQuantities[cardIdStr] = newQuantity;
    }

    const newCardIds =
      newQuantity === 0
        ? currentCardIds.filter((id) => id !== args.cardId)
        : currentCardIds;

    await ctx.db.patch(args.deckId, {
      [cardIdsKey]: newCardIds,
      [quantitiesKey]: newQuantities,
    });

    return null;
  },
});

export const moveCard = mutation({
  args: {
    deckId: v.id("decks"),
    cardId: v.id("cards"),
    fromSection: deckSectionValidator,
    toSection: deckSectionValidator,
    quantity: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.fromSection === args.toSection) {
      return null;
    }

    const userId = await requireAuth(ctx);

    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    if (deck.userId !== userId) throw new Error("Not authorized");

    const cardIdStr = args.cardId.toString();
    const moveQuantity = args.quantity ?? 1;

    const fromCardIdsKey = `${args.fromSection}CardIds` as const;
    const fromQuantitiesKey = `${args.fromSection}Quantities` as const;
    const toCardIdsKey = `${args.toSection}CardIds` as const;
    const toQuantitiesKey = `${args.toSection}Quantities` as const;

    const fromCardIds = deck[fromCardIdsKey];
    const fromQuantities = deck[fromQuantitiesKey];
    const toCardIds = deck[toCardIdsKey];
    const toQuantities = deck[toQuantitiesKey];

    const fromQuantity = fromQuantities[cardIdStr] ?? 0;
    const actualMoveQuantity = Math.min(moveQuantity, fromQuantity);

    if (actualMoveQuantity === 0) {
      return null;
    }

    const newFromQuantity = fromQuantity - actualMoveQuantity;
    const newFromQuantities = { ...fromQuantities };
    if (newFromQuantity === 0) {
      delete newFromQuantities[cardIdStr];
    } else {
      newFromQuantities[cardIdStr] = newFromQuantity;
    }

    const newFromCardIds =
      newFromQuantity === 0
        ? fromCardIds.filter((id) => id !== args.cardId)
        : fromCardIds;

    const toQuantity = toQuantities[cardIdStr] ?? 0;
    const newToQuantities = {
      ...toQuantities,
      [cardIdStr]: toQuantity + actualMoveQuantity,
    };

    const newToCardIds = toCardIds.includes(args.cardId)
      ? toCardIds
      : [...toCardIds, args.cardId];

    await ctx.db.patch(args.deckId, {
      [fromCardIdsKey]: newFromCardIds,
      [fromQuantitiesKey]: newFromQuantities,
      [toCardIdsKey]: newToCardIds,
      [toQuantitiesKey]: newToQuantities,
    });

    return null;
  },
});

export const deleteDeck = mutation({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    if (deck.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.deckId);
    return null;
  },
});

export const updateCardLayout = mutation({
  args: {
    deckId: v.id("decks"),
    layoutKey: v.string(),
    layout: cardLayoutValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    if (deck.userId !== userId) throw new Error("Not authorized");

    const currentLayouts = deck.cardLayouts ?? {};
    await ctx.db.patch(args.deckId, {
      cardLayouts: {
        ...currentLayouts,
        [args.layoutKey]: args.layout,
      },
    });

    return null;
  },
});

export const deleteCardLayout = mutation({
  args: {
    deckId: v.id("decks"),
    layoutKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    if (deck.userId !== userId) throw new Error("Not authorized");

    const currentLayouts = deck.cardLayouts ?? {};
    const newLayouts = { ...currentLayouts };
    delete newLayouts[args.layoutKey];

    await ctx.db.patch(args.deckId, {
      cardLayouts: Object.keys(newLayouts).length > 0 ? newLayouts : undefined,
    });

    return null;
  },
});
