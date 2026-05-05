import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { migrateLegacySessionFields } from "./lib/appearanceMigration";
import { canViewDeck } from "./lib/deckAccess";
import { chromeVariantValidator, colorSourceValidator, sessionValidator, themePreferenceValidator } from "./validators";

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function assertHexColor(kind: string, value: string) {
  if (!HEX_COLOR.test(value)) {
    throw new Error(`Invalid ${kind}: use #RRGGBB or #RRGGBBAA`);
  }
}

function validateModeColors(
  label: string,
  pair: { light: { primary: string; secondary: string }; dark: { primary: string; secondary: string } },
) {
  assertHexColor(`${label} light primary`, pair.light.primary);
  assertHexColor(`${label} light secondary`, pair.light.secondary);
  assertHexColor(`${label} dark primary`, pair.dark.primary);
  assertHexColor(`${label} dark secondary`, pair.dark.secondary);
}

type ModePair = {
  light: { primary: string; secondary: string };
  dark: { primary: string; secondary: string };
};

function validateAppearanceCustom(custom: {
  fallback: ModePair;
  byChrome?: {
    calm?: ModePair;
    expressive?: ModePair;
    holoterminal?: ModePair;
    bubblegum?: ModePair;
    darkmatter?: ModePair;
  };
}) {
  validateModeColors("custom fallback", custom.fallback);
  const bc = custom.byChrome;
  if (!bc) return;
  const keys = [
    ["calm", bc.calm],
    ["expressive", bc.expressive],
    ["holoterminal", bc.holoterminal],
    ["bubblegum", bc.bubblegum],
    ["darkmatter", bc.darkmatter],
  ] as const;
  for (const [slug, pair] of keys) {
    if (pair !== undefined) {
      validateModeColors(`custom ${slug}`, pair);
    }
  }
}

export const getSession = query({
  args: {},
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.query("sessions").withIndex("by_user", (q) => q.eq("userId", userId)).first();
  },
});

export const ensureAppearanceMigrated = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const session = await ctx.db.query("sessions").withIndex("by_user", (q) => q.eq("userId", userId)).first();

    if (!session) {
      return null;
    }
    if (session.colorSource !== undefined && session.chrome !== undefined) {
      return null;
    }

    const legacy = {
      colorScheme: session.colorScheme ?? undefined,
      chromePreference: session.chromePreference ?? undefined,
    };
    const migrated = migrateLegacySessionFields(legacy);

    if (session.colorSource === undefined) {
      await ctx.db.patch(session._id, {
        chrome: migrated.chrome,
        colorSource: migrated.colorSource,
        lastActiveAt: Date.now(),
      });
    } else {
      await ctx.db.patch(session._id, {
        chrome: migrated.chrome,
        lastActiveAt: Date.now(),
      });
    }

    return null;
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

    if (args.deckId) {
      const deck = await ctx.db.get(args.deckId);
      if (!deck) {
        return null;
      }
      const allowed = await canViewDeck(ctx, deck, args.deckId);
      if (!allowed) {
        return null;
      }
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
    chrome: v.optional(chromeVariantValidator),
    colorSource: v.optional(colorSourceValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    if (args.colorSource?.kind === "custom") {
      validateAppearanceCustom(args.colorSource.custom);
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
    if (args.chrome !== undefined) {
      updates.chrome = args.chrome;
    }
    if (args.colorSource !== undefined) {
      updates.colorSource = args.colorSource;
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
