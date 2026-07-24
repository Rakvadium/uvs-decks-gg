import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

type LegacyDeckFields = {
  cardIds?: Id<"cards">[];
  cardQuantities?: Record<string, number>;
};

export const migrateDecksToSectionSchema = internalMutation({
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
      const legacy = deck as Doc<"decks"> & LegacyDeckFields;
      const hasOldSchema = legacy.cardIds !== undefined;
      const hasNewSchema = deck.mainCardIds !== undefined;

      if (hasOldSchema && !hasNewSchema) {
        const oldCardIds = legacy.cardIds ?? [];
        const oldQuantities = legacy.cardQuantities ?? {};

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
