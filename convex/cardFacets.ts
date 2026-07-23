import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export async function runCatalogAggregateRefresh(
  ctx: MutationCtx,
): Promise<{ galleryCount: number }> {
  const rarities = new Set<string>();
  const types = new Set<string>();
  const setCodes = new Set<string>();
  let galleryCount = 0;
  for await (const card of ctx.db.query("cards")) {
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
  const now = Date.now();
  const row = await ctx.db
    .query("cardFacetSnapshot")
    .withIndex("by_key", (q) => q.eq("key", "default"))
    .first();
  const doc = {
    key: "default" as const,
    rarities: Array.from(rarities).sort(),
    types: Array.from(types).sort(),
    setCodes: Array.from(setCodes).sort(),
    updatedAt: now,
  };
  if (row) {
    await ctx.db.patch(row._id, {
      rarities: doc.rarities,
      types: doc.types,
      setCodes: doc.setCodes,
      updatedAt: doc.updatedAt,
    });
  } else {
    await ctx.db.insert("cardFacetSnapshot", doc);
  }
  return { galleryCount };
}

export const rebuildCardFacetSnapshot = internalMutation({
  args: {},
  returns: v.object({ galleryCount: v.number() }),
  handler: async (ctx) => {
    return await runCatalogAggregateRefresh(ctx);
  },
});
