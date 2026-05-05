import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  canViewDeck,
  getDeckRevision,
  isTeamEditableDeck,
} from "../lib/deckAccess";
import { requireAuth } from "../utils/validation";
import {
  deckBuilderUiStateV1Validator,
  deckPresenceCursorValidator,
} from "../validators";

const COLLAB_COLORS = [
  "#e11d48",
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#d97706",
  "#db2777",
  "#0d9488",
  "#ea580c",
  "#4f46e5",
  "#65a30d",
  "#c026d3",
  "#0ea5e9",
];

function colorForUserId(userId: Id<"users">): string {
  let h = 0;
  const s = userId as string;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return COLLAB_COLORS[h % COLLAB_COLORS.length];
}

const uiStatePatchValidator = v.object({
  rightSidebarAction: v.optional(v.string()),
  galleryFilters: v.optional(v.any()),
  activeDeckSection: v.optional(
    v.union(v.literal("main"), v.literal("side"), v.literal("reference")),
  ),
});

const builderSessionReturnValidator = v.union(
  v.null(),
  v.object({
    _id: v.id("deckBuilderSessions"),
    deckId: v.id("decks"),
    updatedAt: v.number(),
    uiState: deckBuilderUiStateV1Validator,
    deckRevision: v.optional(v.number()),
  }),
);

const presenceRowValidator = v.object({
  _id: v.id("deckPresence"),
  _creationTime: v.number(),
  deckId: v.id("decks"),
  userId: v.id("users"),
  sessionId: v.string(),
  color: v.string(),
  label: v.string(),
  cursor: deckPresenceCursorValidator,
  lastSeenAt: v.number(),
});

async function requireTeamEditableCollaborationViewer(
  ctx: QueryCtx | MutationCtx,
  deck: Doc<"decks">,
  deckId: Id<"decks">,
): Promise<void> {
  const allowed = await canViewDeck(ctx, deck, deckId);
  if (!allowed || !isTeamEditableDeck(deck)) {
    throw new Error("Not authorized");
  }
}

async function getOrCreateBuilderSession(
  ctx: MutationCtx,
  deck: Doc<"decks">,
): Promise<Doc<"deckBuilderSessions">> {
  const existing = await ctx.db
    .query("deckBuilderSessions")
    .withIndex("by_deckId", (q) => q.eq("deckId", deck._id))
    .first();
  if (existing) {
    return existing;
  }
  if (!deck.teamId) {
    throw new Error("Deck has no team");
  }
  const inserted = await ctx.db.insert("deckBuilderSessions", {
    deckId: deck._id,
    teamId: deck.teamId,
    updatedAt: Date.now(),
    uiState: { v: 1 },
    deckRevision: deck.revision,
  });
  const created = await ctx.db.get(inserted);
  if (!created) {
    throw new Error("Session create failed");
  }
  return created;
}

export const getBuilderSession = query({
  args: { deckId: v.id("decks") },
  returns: builderSessionReturnValidator,
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      return null;
    }
    const viewer = await getAuthUserId(ctx);
    if (!viewer) {
      return null;
    }
    const allowed = await canViewDeck(ctx, deck, args.deckId);
    if (!allowed || !isTeamEditableDeck(deck)) {
      return null;
    }
    const row = await ctx.db
      .query("deckBuilderSessions")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .first();
    if (!row) {
      return null;
    }
    return {
      _id: row._id,
      deckId: row.deckId,
      updatedAt: row.updatedAt,
      uiState: row.uiState,
      deckRevision: row.deckRevision,
    };
  },
});

export const listPresence = query({
  args: { deckId: v.id("decks") },
  returns: v.array(presenceRowValidator),
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      return [];
    }
    const viewer = await getAuthUserId(ctx);
    if (!viewer) {
      return [];
    }
    const allowed = await canViewDeck(ctx, deck, args.deckId);
    if (!allowed || !isTeamEditableDeck(deck)) {
      return [];
    }
    return await ctx.db
      .query("deckPresence")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .collect();
  },
});

export const patchBuilderUiState = mutation({
  args: {
    deckId: v.id("decks"),
    uiStatePatch: uiStatePatchValidator,
    deckRevision: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }
    await requireTeamEditableCollaborationViewer(ctx, deck, args.deckId);
    const session = await getOrCreateBuilderSession(ctx, deck);
    const prev = session.uiState;
    const merged: Doc<"deckBuilderSessions">["uiState"] = {
      ...prev,
      v: 1,
    };
    if (args.uiStatePatch.rightSidebarAction !== undefined) {
      merged.rightSidebarAction = args.uiStatePatch.rightSidebarAction;
    }
    if (args.uiStatePatch.galleryFilters !== undefined) {
      merged.galleryFilters = args.uiStatePatch.galleryFilters;
    }
    if (args.uiStatePatch.activeDeckSection !== undefined) {
      merged.activeDeckSection = args.uiStatePatch.activeDeckSection;
    }
    await ctx.db.patch(session._id, {
      updatedAt: Date.now(),
      uiState: merged,
      deckRevision:
        args.deckRevision !== undefined
          ? args.deckRevision
          : getDeckRevision(deck),
    });
    return null;
  },
});

export const presenceHeartbeat = mutation({
  args: {
    deckId: v.id("decks"),
    sessionId: v.string(),
    cursor: deckPresenceCursorValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }
    await requireTeamEditableCollaborationViewer(ctx, deck, args.deckId);
    const user = await ctx.db.get(userId);
    const label = user?.username?.trim() || "Player";
    const color = colorForUserId(userId);
    const now = Date.now();
    const existing = await ctx.db
      .query("deckPresence")
      .withIndex("by_deckId_and_userId_and_sessionId", (q) =>
        q
          .eq("deckId", args.deckId)
          .eq("userId", userId)
          .eq("sessionId", args.sessionId),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        cursor: args.cursor,
        lastSeenAt: now,
        label,
        color,
      });
    } else {
      await ctx.db.insert("deckPresence", {
        deckId: args.deckId,
        userId,
        sessionId: args.sessionId,
        color,
        label,
        cursor: args.cursor,
        lastSeenAt: now,
      });
    }
    return null;
  },
});

export const pruneStaleDeckPresence = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const cutoff = Date.now() - 120_000;
    const rows = await ctx.db.query("deckPresence").collect();
    for (const row of rows) {
      if (row.lastSeenAt < cutoff) {
        await ctx.db.delete(row._id);
      }
    }
    return null;
  },
});
