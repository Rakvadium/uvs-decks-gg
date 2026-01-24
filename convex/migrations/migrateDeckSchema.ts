import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const migrateDecksToSectionSchema = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    alreadyMigratedCount: v.number(),
  }),
  handler: async (ctx) => {
    const allDecks = await ctx.db.query("decks").collect();
    
    let migratedCount = 0;
    let alreadyMigratedCount = 0;

    for (const deck of allDecks) {
      const hasOldSchema = (deck as any).cardIds !== undefined;
      const hasNewSchema = deck.mainCardIds !== undefined;

      if (hasOldSchema && !hasNewSchema) {
        const oldCardIds = (deck as any).cardIds ?? [];
        const oldQuantities = (deck as any).cardQuantities ?? {};

        await ctx.db.patch(deck._id, {
          mainCardIds: oldCardIds,
          mainQuantities: oldQuantities,
          sideCardIds: [],
          sideQuantities: {},
          referenceCardIds: [],
          referenceQuantities: {},
        });

        migratedCount++;
      } else if (hasNewSchema) {
        alreadyMigratedCount++;
      }
    }

    return { migratedCount, alreadyMigratedCount };
  },
});
