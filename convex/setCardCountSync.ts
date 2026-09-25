import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { GameId } from "../shared/games/types";

function isListGalleryCard(card: {
  isFrontFace?: boolean;
  isVariant?: boolean;
}): boolean {
  return card.isFrontFace !== false && card.isVariant !== true;
}

export async function countListCardsForSetCode(
  ctx: QueryCtx | MutationCtx,
  game: GameId,
  setCode: string
): Promise<number> {
  if (!setCode) {
    return 0;
  }
  const cards = await ctx.db
    .query("cards")
    .withIndex("by_game_and_setCode_and_collectorNumber", (q) =>
      q.eq("game", game).eq("setCode", setCode)
    )
    .collect();
  return cards.filter((c) => isListGalleryCard(c)).length;
}

export async function syncSetCardCountByCode(
  ctx: MutationCtx,
  game: GameId,
  setCode: string | undefined
): Promise<void> {
  if (!setCode) {
    return;
  }
  const setDoc = await ctx.db
    .query("sets")
    .withIndex("by_game_and_code", (q) => q.eq("game", game).eq("code", setCode))
    .unique();
  if (!setDoc) {
    return;
  }
  const n = await countListCardsForSetCode(ctx, game, setCode);
  if (setDoc.cardCount === n) {
    return;
  }
  await ctx.db.patch(setDoc._id, { cardCount: n });
}

export async function syncSetCardCountsByCodes(
  ctx: MutationCtx,
  game: GameId,
  setCodes: Iterable<string>
): Promise<void> {
  const seen = new Set<string>();
  for (const c of setCodes) {
    if (c && !seen.has(c)) {
      seen.add(c);
      await syncSetCardCountByCode(ctx, game, c);
    }
  }
}
