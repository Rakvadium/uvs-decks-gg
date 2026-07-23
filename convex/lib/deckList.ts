import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export async function attachOwnerUsernames(
  ctx: Pick<QueryCtx, "db">,
  decks: Doc<"decks">[],
): Promise<Array<Doc<"decks"> & { ownerUsername?: string }>> {
  const ownerIds = [...new Set(decks.map((d) => d.userId))] as Id<"users">[];
  const userMap = new Map<Id<"users">, string | undefined>();
  for (const ownerId of ownerIds) {
    const user = await ctx.db.get(ownerId);
    userMap.set(ownerId, user?.username ?? undefined);
  }
  return decks.map((deck) => ({
    ...deck,
    ownerUsername: userMap.get(deck.userId),
  }));
}
