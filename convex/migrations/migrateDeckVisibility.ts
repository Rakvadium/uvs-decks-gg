import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const backfillDeckVisibility = mutation({
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
