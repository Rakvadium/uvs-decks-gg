import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  deckValidator,
  cardLayoutValidator,
  deckCardMutationResultValidator,
  deckSectionValidator,
  deckTeamCollaborationValidator,
  deckVisibilityValidator,
} from "./validators";
import { requireAdmin, requireAuth, requireNotBackFace, requireUserCanPostContent } from "./utils/validation";
import {
  assertTeamEditableCardWriteRevision,
  canViewDeck,
  getDeckRevision,
  normalizeDeckVisibility,
  requireDeckWriteAccess,
  syncListingIsPublic,
} from "./lib/deckAccess";
import { requireCapability } from "./teams/permissions";

export const listByUser = query({
  args: {
    userId: v.id("users"),
    search: v.optional(v.string()),
    visibility: v.optional(deckVisibilityValidator),
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

    if (args.visibility !== undefined) {
      decks = decks.filter((deck) => normalizeDeckVisibility(deck) === args.visibility);
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

    return decks.filter((d) => {
      const vis = normalizeDeckVisibility(d);
      return vis === "public" || vis === "tournament";
    });
  },
});

export const listTournament = query({
  args: {
    search: v.optional(v.string()),
  },
  returns: v.array(deckValidator),
  handler: async (ctx, args) => {
    let decks = await ctx.db
      .query("decks")
      .withIndex("by_visibility", (q) => q.eq("visibility", "tournament"))
      .collect();

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      decks = decks.filter(
        (deck) =>
          deck.name.toLowerCase().includes(searchLower) ||
          deck.description?.toLowerCase().includes(searchLower)
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
    const deck = await ctx.db.get(args.deckId);
    if (!deck) return null;
    const allowed = await canViewDeck(ctx, deck, args.deckId);
    if (!allowed) return null;
    return deck;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    visibility: v.optional(deckVisibilityValidator),
    teamId: v.optional(v.id("teams")),
    teamCollaboration: v.optional(deckTeamCollaborationValidator),
    format: v.optional(v.string()),
    startingCharacterId: v.optional(v.id("cards")),
    selectedIdentity: v.optional(v.string()),
  },
  returns: v.id("decks"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireUserCanPostContent(ctx, userId);

    if (args.startingCharacterId) {
      await requireNotBackFace(ctx, args.startingCharacterId);
    }

    const visibility = args.visibility ?? "private";
    if (visibility === "tournament") {
      await requireAdmin(ctx);
    }

    if (visibility === "team") {
      if (!args.teamId) {
        throw new Error("teamId is required for team visibility");
      }
      const collab = args.teamCollaboration ?? "team_viewable";
      if (collab === "none") {
        throw new Error("teamCollaboration cannot be none for team visibility");
      }
      await requireCapability(ctx, args.teamId, "create_team_deck");
    } else {
      if (args.teamId !== undefined) {
        throw new Error("teamId is only valid when visibility is team");
      }
      if (args.teamCollaboration !== undefined && args.teamCollaboration !== "none") {
        throw new Error("teamCollaboration is only set when visibility is team");
      }
    }

    return await ctx.db.insert("decks", {
      userId,
      name: args.name,
      description: args.description,
      visibility,
      teamId: visibility === "team" ? args.teamId : undefined,
      teamCollaboration:
        visibility === "team" ? (args.teamCollaboration ?? "team_viewable") : "none",
      isPublic: syncListingIsPublic(visibility),
      format: args.format,
      startingCharacterId: args.startingCharacterId,
      selectedIdentity: args.selectedIdentity,
      mainCardIds: [],
      mainQuantities: {},
      sideCardIds: [],
      sideQuantities: {},
      referenceCardIds: [],
      referenceQuantities: {},
      revision: 0,
    });
  },
});

export const update = mutation({
  args: {
    deckId: v.id("decks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    visibility: v.optional(deckVisibilityValidator),
    teamId: v.optional(v.union(v.id("teams"), v.null())),
    teamCollaboration: v.optional(deckTeamCollaborationValidator),
    imageCardId: v.optional(v.union(v.id("cards"), v.null())),
    startingCharacterId: v.optional(v.union(v.id("cards"), v.null())),
    selectedIdentity: v.optional(v.union(v.string(), v.null())),
    format: v.optional(v.union(v.string(), v.null())),
    subFormat: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    await requireDeckWriteAccess(ctx, deck);

    if (args.startingCharacterId !== undefined && args.startingCharacterId !== null) {
      await requireNotBackFace(ctx, args.startingCharacterId);
    }

    const nextVisibility =
      args.visibility !== undefined ? args.visibility : normalizeDeckVisibility(deck);

    if (args.visibility !== undefined) {
      if (args.visibility === "tournament") {
        await requireAdmin(ctx);
      }
      const prev = normalizeDeckVisibility(deck);
      if (prev === "share" && args.visibility !== "share") {
        const shares = await ctx.db
          .query("deckShares")
          .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
          .collect();
        for (const s of shares) {
          await ctx.db.delete(s._id);
        }
      }
    }

    if (nextVisibility === "team") {
      const resolvedTeamId =
        args.teamId !== undefined
          ? (args.teamId === null ? undefined : args.teamId)
          : deck.teamId;
      if (resolvedTeamId === undefined) {
        throw new Error("teamId is required for team visibility");
      }
      const collab =
        args.teamCollaboration !== undefined
          ? args.teamCollaboration
          : (deck.teamCollaboration ?? "team_viewable");
      if (collab === "none") {
        throw new Error("teamCollaboration cannot be none for team visibility");
      }
      await requireCapability(ctx, resolvedTeamId, "create_team_deck");
    } else {
      if (args.teamId !== undefined && args.teamId !== null) {
        throw new Error("teamId is only valid when visibility is team");
      }
      if (
        args.teamCollaboration !== undefined &&
        args.teamCollaboration !== "none"
      ) {
        throw new Error("teamCollaboration is only set when visibility is team");
      }
    }

    const { deckId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (key === "teamId" && value === null) {
          filteredUpdates.teamId = undefined;
        } else if (
          (key === "format" ||
            key === "subFormat" ||
            key === "description" ||
            key === "selectedIdentity") &&
          value === null
        ) {
          filteredUpdates[key] = undefined;
        } else if ((key === "imageCardId" || key === "startingCharacterId") && value === null) {
          filteredUpdates[key] = undefined;
        } else {
          filteredUpdates[key] = value;
        }
      }
    }
    if (args.visibility !== undefined) {
      filteredUpdates.isPublic = syncListingIsPublic(args.visibility);
      if (args.visibility === "team") {
        if (args.teamId !== undefined) {
          filteredUpdates.teamId = args.teamId === null ? undefined : args.teamId;
        }
        if (args.teamCollaboration !== undefined) {
          filteredUpdates.teamCollaboration = args.teamCollaboration;
        } else if (deck.teamCollaboration === undefined) {
          filteredUpdates.teamCollaboration = "team_viewable";
        }
      } else {
        filteredUpdates.teamId = undefined;
        filteredUpdates.teamCollaboration = "none";
      }
    } else if (args.teamId !== undefined || args.teamCollaboration !== undefined) {
      if (nextVisibility !== "team") {
        throw new Error("team fields require team visibility");
      }
      if (args.teamId !== undefined) {
        filteredUpdates.teamId = args.teamId === null ? undefined : args.teamId;
      }
      if (args.teamCollaboration !== undefined) {
        if (args.teamCollaboration === "none") {
          throw new Error("teamCollaboration cannot be none for team visibility");
        }
        filteredUpdates.teamCollaboration = args.teamCollaboration;
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
    expectedRevision: v.optional(v.number()),
  },
  returns: deckCardMutationResultValidator,
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    await requireDeckWriteAccess(ctx, deck);
    assertTeamEditableCardWriteRevision(deck, args.expectedRevision);

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

    const nextRevision = getDeckRevision(deck) + 1;
    await ctx.db.patch(args.deckId, {
      [cardIdsKey]: newCardIds,
      [quantitiesKey]: {
        ...currentQuantities,
        [cardIdStr]: currentQuantity + addQuantity,
      },
      revision: nextRevision,
    });

    return { revision: nextRevision };
  },
});

export const removeCard = mutation({
  args: {
    deckId: v.id("decks"),
    cardId: v.id("cards"),
    section: deckSectionValidator,
    quantity: v.optional(v.number()),
    expectedRevision: v.optional(v.number()),
  },
  returns: deckCardMutationResultValidator,
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    await requireDeckWriteAccess(ctx, deck);
    assertTeamEditableCardWriteRevision(deck, args.expectedRevision);

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

    const nextRevision = getDeckRevision(deck) + 1;
    await ctx.db.patch(args.deckId, {
      [cardIdsKey]: newCardIds,
      [quantitiesKey]: newQuantities,
      revision: nextRevision,
    });

    return { revision: nextRevision };
  },
});

export const moveCard = mutation({
  args: {
    deckId: v.id("decks"),
    cardId: v.id("cards"),
    fromSection: deckSectionValidator,
    toSection: deckSectionValidator,
    quantity: v.optional(v.number()),
    expectedRevision: v.optional(v.number()),
  },
  returns: deckCardMutationResultValidator,
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    await requireDeckWriteAccess(ctx, deck);
    assertTeamEditableCardWriteRevision(deck, args.expectedRevision);

    if (args.fromSection === args.toSection) {
      return { revision: getDeckRevision(deck) };
    }

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
      return { revision: getDeckRevision(deck) };
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

    const nextRevision = getDeckRevision(deck) + 1;
    await ctx.db.patch(args.deckId, {
      [fromCardIdsKey]: newFromCardIds,
      [fromQuantitiesKey]: newFromQuantities,
      [toCardIdsKey]: newToCardIds,
      [toQuantitiesKey]: newToQuantities,
      revision: nextRevision,
    });

    return { revision: nextRevision };
  },
});

export const deleteDeck = mutation({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    await requireDeckWriteAccess(ctx, deck);

    await ctx.db.delete(args.deckId);
    return null;
  },
});

export const updateCardLayout = mutation({
  args: {
    deckId: v.id("decks"),
    layoutKey: v.string(),
    layout: cardLayoutValidator,
    expectedRevision: v.optional(v.number()),
  },
  returns: deckCardMutationResultValidator,
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    await requireDeckWriteAccess(ctx, deck);
    assertTeamEditableCardWriteRevision(deck, args.expectedRevision);

    const currentLayouts = deck.cardLayouts ?? {};
    const nextRevision = getDeckRevision(deck) + 1;
    await ctx.db.patch(args.deckId, {
      cardLayouts: {
        ...currentLayouts,
        [args.layoutKey]: args.layout,
      },
      revision: nextRevision,
    });

    return { revision: nextRevision };
  },
});

export const deleteCardLayout = mutation({
  args: {
    deckId: v.id("decks"),
    layoutKey: v.string(),
    expectedRevision: v.optional(v.number()),
  },
  returns: deckCardMutationResultValidator,
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    await requireDeckWriteAccess(ctx, deck);
    assertTeamEditableCardWriteRevision(deck, args.expectedRevision);

    const currentLayouts = deck.cardLayouts ?? {};
    const newLayouts = { ...currentLayouts };
    delete newLayouts[args.layoutKey];

    const nextRevision = getDeckRevision(deck) + 1;
    await ctx.db.patch(args.deckId, {
      cardLayouts: Object.keys(newLayouts).length > 0 ? newLayouts : undefined,
      revision: nextRevision,
    });

    return { revision: nextRevision };
  },
});
