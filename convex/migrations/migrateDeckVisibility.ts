import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const backfillDeckVisibility = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const decks = await ctx.db.query("decks").collect();
    let updated = 0;
    let skipped = 0;
    for (const deck of decks) {
      if (deck.visibility !== undefined) {
        skipped++;
        continue;
      }
      const visibility = deck.isPublic ? "public" : "private";
      await ctx.db.patch(deck._id, { visibility });
      updated++;
    }
    return { updated, skipped };
  },
});

export const migratePrivateDecksToUnlisted = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const decks = await ctx.db.query("decks").collect();
    let updated = 0;
    let skipped = 0;
    for (const deck of decks) {
      if (deck.visibility !== "private") {
        skipped++;
        continue;
      }
      await ctx.db.patch(deck._id, { visibility: "unlisted" });
      updated++;
    }
    return { updated, skipped };
  },
});
