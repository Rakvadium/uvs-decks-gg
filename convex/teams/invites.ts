import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { teamRoleValidator } from "../validators";
import { requireAuth } from "../utils/validation";
import {
  collectTeamsForUser,
  exitAllTeamsForUserSwitching,
  getEffectiveTeamRole,
  requireCapability,
  type TeamRole,
} from "./permissions";

const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function loadTeamOrThrow(ctx: MutationCtx, teamId: Id<"teams">): Promise<Doc<"teams">> {
  const team = await ctx.db.get(teamId);
  if (!team) throw new Error("Team not found");
  return team;
}

function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashInviteToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function parseInviteRole(role: TeamRole | undefined): TeamRole {
  const r = role ?? "pilot";
  if (r === "captain") throw new Error("Cannot invite with captain role");
  return r;
}

const inviteLookupReturns = v.union(
  v.null(),
  v.object({
    inviteId: v.id("teamInvites"),
    teamId: v.id("teams"),
    teamName: v.string(),
    expiresAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    viewer: v.union(
      v.object({ signedIn: v.literal(false) }),
      v.object({
        signedIn: v.literal(true),
        alreadyMemberOfInvitedTeam: v.boolean(),
        needsLeaveCurrentTeamConfirmation: v.boolean(),
        currentTeamName: v.optional(v.string()),
      }),
    ),
  }),
);

export const getInviteDetails = query({
  args: { token: v.string() },
  returns: inviteLookupReturns,
  handler: async (ctx, args) => {
    const trimmed = args.token.trim();
    if (trimmed.length < 16) return null;
    const tokenHash = await hashInviteToken(trimmed);
    const inv = await ctx.db
      .query("teamInvites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!inv) return null;
    const team = await ctx.db.get(inv.teamId);
    if (!team) return null;
    let status: "pending" | "accepted" | "declined" = "pending";
    if (inv.acceptedAt !== undefined) status = "accepted";
    else if (inv.declinedAt !== undefined) status = "declined";

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        inviteId: inv._id,
        teamId: inv.teamId,
        teamName: team.name,
        expiresAt: inv.expiresAt,
        status,
        viewer: { signedIn: false as const },
      };
    }

    const roleHere = await getEffectiveTeamRole(ctx, team, userId);
    const alreadyMemberOfInvitedTeam = roleHere !== null;

    const myTeams = await collectTeamsForUser(ctx, userId);
    const others = myTeams.filter((t) => t._id !== inv.teamId);
    const needsLeaveCurrentTeamConfirmation =
      !alreadyMemberOfInvitedTeam && others.length > 0;

    return {
      inviteId: inv._id,
      teamId: inv.teamId,
      teamName: team.name,
      expiresAt: inv.expiresAt,
      status,
      viewer: {
        signedIn: true as const,
        alreadyMemberOfInvitedTeam,
        needsLeaveCurrentTeamConfirmation,
        currentTeamName: others[0]?.name,
      },
    };
  },
});

export const createInvite = mutation({
  args: {
    teamId: v.id("teams"),
    role: v.optional(teamRoleValidator),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const actorId = await requireAuth(ctx);
    await requireCapability(ctx, args.teamId, "invite_members");
    await loadTeamOrThrow(ctx, args.teamId);

    const inviteRole = parseInviteRole(args.role);
    const now = Date.now();
    const expiresAt =
      args.expiresAt !== undefined ? args.expiresAt : now + DEFAULT_INVITE_TTL_MS;
    if (expiresAt <= now) throw new Error("expiresAt must be in the future");

    const token = generateInviteToken();
    const tokenHash = await hashInviteToken(token);

    await ctx.db.insert("teamInvites", {
      teamId: args.teamId,
      tokenHash,
      role: inviteRole,
      invitedByUserId: actorId,
      createdAt: now,
      expiresAt,
    });

    return { token };
  },
});

export const revokeInvite = mutation({
  args: { inviteId: v.id("teamInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    await requireCapability(ctx, invite.teamId, "invite_members");
    if (invite.acceptedAt !== undefined) {
      throw new Error("Invite already accepted");
    }
    await ctx.db.delete(args.inviteId);
    return null;
  },
});

export const declineInvite = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const token = args.token.trim();
    if (token.length < 16) throw new Error("Invalid invite");
    const tokenHash = await hashInviteToken(token);
    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!invite) throw new Error("Invalid or expired invite");
    if (invite.acceptedAt !== undefined) throw new Error("Invite already accepted");
    if (invite.declinedAt !== undefined) throw new Error("Invite already declined");
    const now = Date.now();
    if (invite.expiresAt <= now) throw new Error("Invite has expired");
    await ctx.db.patch(invite._id, { declinedAt: now });
    return null;
  },
});

export const acceptInvite = mutation({
  args: {
    token: v.string(),
    leaveCurrentTeamConfirmed: v.optional(v.boolean()),
  },
  returns: v.object({ teamId: v.id("teams") }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const token = args.token.trim();
    if (token.length < 16) throw new Error("Invalid invite");

    const tokenHash = await hashInviteToken(token);
    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    if (!invite) throw new Error("Invalid or expired invite");
    if (invite.acceptedAt !== undefined) throw new Error("Invite already accepted");
    if (invite.declinedAt !== undefined) throw new Error("Invite was declined");
    const now = Date.now();
    if (invite.expiresAt <= now) throw new Error("Invite has expired");

    const team = await loadTeamOrThrow(ctx, invite.teamId);
    const existingRoleHere = await getEffectiveTeamRole(ctx, team, userId);
    if (existingRoleHere !== null) throw new Error("Already a member");

    const myTeams = await collectTeamsForUser(ctx, userId);
    const others = myTeams.filter((t) => t._id !== invite.teamId);
    if (others.length > 0 && args.leaveCurrentTeamConfirmed !== true) {
      throw new Error("LEAVE_CURRENT_TEAM_CONFIRMATION_REQUIRED");
    }

    await exitAllTeamsForUserSwitching(ctx, userId);

    const existingRow = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) =>
        q.eq("teamId", invite.teamId).eq("userId", userId),
      )
      .unique();

    if (existingRow?.status === "removed") {
      await ctx.db.patch(existingRow._id, {
        status: "active",
        role: invite.role,
        joinedAt: now,
      });
    } else if (existingRow === null) {
      await ctx.db.insert("teamMembers", {
        teamId: invite.teamId,
        userId,
        role: invite.role,
        joinedAt: now,
        status: "active",
      });
    } else {
      throw new Error("Already a member");
    }

    await ctx.db.patch(invite._id, { acceptedAt: now });
    return { teamId: invite.teamId };
  },
});
