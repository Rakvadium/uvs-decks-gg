import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  effectiveAccountStatus,
  isDocAccountActiveForQuery,
  userCanPostContent,
  userCanUpdateProfile,
} from "../lib/accountStatus";

function isMutationCtx(ctx: QueryCtx | MutationCtx): ctx is MutationCtx {
  return "scheduler" in ctx;
}

export async function applyLazyExpireForUserIfNeeded(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  const now = Date.now();
  const user = await ctx.db.get(userId);
  if (!user) return;
  if (user.statusExpiresAt === undefined) return;
  if (user.statusExpiresAt > now) return;
  await ctx.db.patch(userId, {
    accountStatus: "active",
    statusExpiresAt: undefined,
    statusReason: undefined,
    userFacingMessage: undefined,
    statusSetAt: undefined,
    statusSetBy: undefined,
  });
}

export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function requireUserCanPostContent(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  await applyLazyExpireForUserIfNeeded(ctx, userId);
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  const st = effectiveAccountStatus(user, Date.now());
  if (!userCanPostContent(st)) {
    throw new Error("This account is restricted from creating or editing content.");
  }
}

export async function requireUserCanUpdateProfile(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  await applyLazyExpireForUserIfNeeded(ctx, userId);
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  const st = effectiveAccountStatus(user, Date.now());
  if (!userCanUpdateProfile(st)) {
    throw new Error("This account is restricted from changing profile settings.");
  }
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await requireAuth(ctx);
  if (isMutationCtx(ctx)) {
    await applyLazyExpireForUserIfNeeded(ctx, userId);
  }
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "Admin") {
    throw new Error("Admin role required");
  }
  if (!isDocAccountActiveForQuery(user)) {
    throw new Error("Admin access requires an active account");
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
