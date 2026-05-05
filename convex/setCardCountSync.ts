import type { MutationCtx, QueryCtx } from "./_generated/server";

function isListGalleryCard(card: {
  isFrontFace?: boolean;
  isVariant?: boolean;
}): boolean {
  return card.isFrontFace !== false && card.isVariant !== true;
}

export async function countListCardsForSetCode(
  ctx: QueryCtx | MutationCtx,
  setCode: string
): Promise<number> {
  if (!setCode) {
    return 0;
  }
  const cards = await ctx.db
    .query("cards")
    .withIndex("by_setCode_and_collectorNumber", (q) => q.eq("setCode", setCode))
    .collect();
  return cards.filter((c) => isListGalleryCard(c)).length;
}

export async function syncSetCardCountByCode(
  ctx: MutationCtx,
  setCode: string | undefined
): Promise<void> {
  if (!setCode) {
    return;
  }
  const setDoc = await ctx.db
    .query("sets")
    .withIndex("by_code", (q) => q.eq("code", setCode))
    .unique();
  if (!setDoc) {
    return;
  }
  const n = await countListCardsForSetCode(ctx, setCode);
  if (setDoc.cardCount === n) {
    return;
  }
  await ctx.db.patch(setDoc._id, { cardCount: n });
}

export async function syncSetCardCountsByCodes(
  ctx: MutationCtx,
  setCodes: Iterable<string>
): Promise<void> {
  const seen = new Set<string>();
  for (const c of setCodes) {
    if (c && !seen.has(c)) {
      seen.add(c);
      await syncSetCardCountByCode(ctx, c);
    }
  }
}
