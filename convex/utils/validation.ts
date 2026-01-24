import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await requireAuth(ctx);
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "Admin") {
    throw new Error("Admin role required");
  }
  return userId;
}

export async function requireNotBackFace(ctx: QueryCtx | MutationCtx, cardId: Id<"cards">) {
  const card = await ctx.db.get(cardId);
  if (!card) throw new Error("Card not found");
  if (card.isFrontFace === false) {
    throw new Error("Cannot add back-face card directly. Add the front face instead.");
  }
  return card;
}
