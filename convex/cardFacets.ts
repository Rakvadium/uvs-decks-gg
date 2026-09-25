import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { gameIdValidator } from "./validators";
import { DEFAULT_GAME_ID, type GameId } from "../shared/games/types";
import { getCardFacetSnapshotDoc, gameValuesWithLegacy } from "./lib/gameScope";

export async function runCatalogAggregateRefresh(
  ctx: MutationCtx,
  game: GameId,
): Promise<{ galleryCount: number }> {
  const rarities = new Set<string>();
  const types = new Set<string>();
  const setCodes = new Set<string>();
  let galleryCount = 0;
  // Default game also scans untagged (pre-backfill) cards so a refresh never empties the facets.
  for (const value of gameValuesWithLegacy(game)) {
    for await (const card of ctx.db
      .query("cards")
      .withIndex("by_game", (q) => q.eq("game", value))) {
      if (card.isFrontFace === false) {
        continue;
      }
      if (card.isRevealHidden === true) {
        continue;
      }
      if (card.rarity) {
        rarities.add(card.rarity);
      }
      if (card.type) {
        types.add(card.type);
      }
      if (card.setCode) {
        setCodes.add(card.setCode);
      }
      if (card.isVariant !== true) {
        galleryCount += 1;
      }
    }
  }
  const now = Date.now();
  // Falls back to the legacy untagged row for the default game; patching it tags it with `game`.
  const row = await getCardFacetSnapshotDoc(ctx, game);
  const doc = {
    key: "default" as const,
    rarities: Array.from(rarities).sort(),
    types: Array.from(types).sort(),
    setCodes: Array.from(setCodes).sort(),
    updatedAt: now,
    game,
  };
  if (row) {
    await ctx.db.patch(row._id, {
      rarities: doc.rarities,
      types: doc.types,
      setCodes: doc.setCodes,
      updatedAt: doc.updatedAt,
      game,
    });
  } else {
    await ctx.db.insert("cardFacetSnapshot", doc);
  }
  return { galleryCount };
}

export const rebuildCardFacetSnapshot = internalMutation({
  args: { game: v.optional(gameIdValidator) },
  returns: v.object({ galleryCount: v.number() }),
  handler: async (ctx, args) => {
    return await runCatalogAggregateRefresh(ctx, args.game ?? DEFAULT_GAME_ID);
  },
});
