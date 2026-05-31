import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getEffectiveTeamRole, hasCapability, type TeamRole } from "../teams/permissions";
import { requireAuth, requireUserCanPostContent } from "../utils/validation";

export type DeckVisibility =
  | "private"
  | "share"
  | "unlisted"
  | "public"
  | "tournament"
  | "team";

export function normalizeDeckVisibility(deck: Doc<"decks">): DeckVisibility {
  if (deck.visibility) {
    if (deck.visibility === "unlisted") return "private";
    return deck.visibility;
  }
  return deck.isPublic ? "public" : "private";
}

export function syncListingIsPublic(visibility: DeckVisibility): boolean {
  return visibility === "public" || visibility === "tournament";
}

export function isTeamEditableDeck(deck: Doc<"decks">): boolean {
  return (
    normalizeDeckVisibility(deck) === "team" &&
    (deck.teamCollaboration ?? "team_viewable") === "team_editable"
  );
}

export function getDeckRevision(deck: Doc<"decks">): number {
  return deck.revision ?? 0;
}

export function assertTeamEditableCardWriteRevision(
  deck: Doc<"decks">,
  expectedRevision: number | undefined,
): void {
  if (!isTeamEditableDeck(deck)) {
    return;
  }
  if (expectedRevision === undefined) {
    throw new Error("CONFLICT: expectedRevision is required for team_editable deck");
  }
  if (getDeckRevision(deck) !== expectedRevision) {
    throw new Error("CONFLICT: deck was modified; refresh and try again");
  }
}

type DeckViewCtx = QueryCtx | MutationCtx;

export async function canViewDeck(
  ctx: DeckViewCtx,
  deck: Doc<"decks">,
  deckId: Id<"decks">,
): Promise<boolean> {
  const visibility = normalizeDeckVisibility(deck);
  const viewer = await getAuthUserId(ctx);
  if (visibility === "private") {
    return true;
  }
  if (visibility === "team") {
    if (!deck.teamId) {
      return false;
    }
    if (viewer === null) {
      return false;
    }
    if (viewer === deck.userId) {
      return true;
    }
    const team = await ctx.db.get(deck.teamId);
    if (!team) {
      return false;
    }
    const role = await getEffectiveTeamRole(ctx, team, viewer);
    if (role === null) {
      return false;
    }
    return hasCapability(role, "view_team_decks");
  }
  if (visibility === "share") {
    if (viewer !== null && viewer === deck.userId) return true;
    if (viewer === null) return false;
    const share = await ctx.db
      .query("deckShares")
      .withIndex("by_deck_and_user", (q) => q.eq("deckId", deckId).eq("userId", viewer))
      .first();
    return share !== null && share.status === "accepted";
  }
  return true;
}

export function canUserWriteDeck(
  userId: Id<"users">,
  deck: Doc<"decks">,
  teamRole: TeamRole | null,
): boolean {
  const visibility = normalizeDeckVisibility(deck);
  if (visibility !== "team") {
    return deck.userId === userId;
  }
  if (!deck.teamId) {
    return deck.userId === userId;
  }
  const collab = deck.teamCollaboration ?? "team_viewable";
  if (collab === "none" || collab === "team_viewable") {
    return deck.userId === userId;
  }
  if (collab === "team_editable") {
    if (deck.userId === userId) return true;
    if (teamRole === null) return false;
    return hasCapability(teamRole, "create_team_deck");
  }
  return false;
}

export async function requireDeckWriteAccess(
  ctx: MutationCtx,
  deck: Doc<"decks">,
): Promise<Id<"users">> {
  const userId = await requireAuth(ctx);
  const visibility = normalizeDeckVisibility(deck);
  if (visibility !== "team" || !deck.teamId) {
    if (!canUserWriteDeck(userId, deck, null)) {
      throw new Error("Not authorized");
    }
    await requireUserCanPostContent(ctx, userId);
    return userId;
  }
  const collab = deck.teamCollaboration ?? "team_viewable";
  if (collab === "none" || collab === "team_viewable") {
    if (!canUserWriteDeck(userId, deck, null)) {
      throw new Error("Not authorized");
    }
    await requireUserCanPostContent(ctx, userId);
    return userId;
  }
  const team = await ctx.db.get(deck.teamId);
  if (!team) {
    throw new Error("Team not found");
  }
  const role = await getEffectiveTeamRole(ctx, team, userId);
  if (!canUserWriteDeck(userId, deck, role)) {
    throw new Error("Not authorized");
  }
  await requireUserCanPostContent(ctx, userId);
  return userId;
}
