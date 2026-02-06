import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { colorSchemeValidator, sessionValidator, themePreferenceValidator } from "./validators";

export const getSession = query({
    args: {},
    returns: v.union(sessionValidator, v.null()),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        return await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
    },
});

export const getActiveDeckId = query({
    args: {},
    returns: v.union(v.id("decks"), v.null()),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const session = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        return session?.activeDeckId ?? null;
    },
});

export const setActiveDeck = mutation({
    args: {
        deckId: v.optional(v.id("decks")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const existingSession = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (existingSession) {
            await ctx.db.patch(existingSession._id, {
                activeDeckId: args.deckId,
                lastActiveAt: Date.now(),
            });
        } else {
            await ctx.db.insert("sessions", {
                userId,
                activeDeckId: args.deckId,
                lastActiveAt: Date.now(),
            });
        }

        return null;
    },
});

export const updateSession = mutation({
    args: {
        galleryFilters: v.optional(v.any()),
        rightSidebarAction: v.optional(v.string()),
        theme: themePreferenceValidator,
        colorScheme: colorSchemeValidator,
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const existingSession = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        const updates: Record<string, unknown> = { lastActiveAt: Date.now() };
        if (args.galleryFilters !== undefined) {
            updates.galleryFilters = args.galleryFilters;
        }
        if (args.rightSidebarAction !== undefined) {
            updates.rightSidebarAction = args.rightSidebarAction;
        }
        if (args.theme !== undefined) {
            updates.theme = args.theme;
        }
        if (args.colorScheme !== undefined) {
            updates.colorScheme = args.colorScheme;
        }

        if (existingSession) {
            await ctx.db.patch(existingSession._id, updates);
        } else {
            await ctx.db.insert("sessions", {
                userId,
                lastActiveAt: Date.now(),
                ...args,
            });
        }

        return null;
    },
});
