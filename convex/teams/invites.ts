import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { teamRoleValidator } from "../validators";
import { requireAuth } from "../utils/validation";
import {
  assertUserHasNoActiveTeamMembership,
  getEffectiveTeamRole,
  requireCapability,
  type TeamRole,
} from "./permissions";

const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashInviteToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

async function loadTeamOrThrow(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<Doc<"teams">> {
  const team = await ctx.db.get(teamId);
  if (!team) throw new Error("Team not found");
  return team;
}

async function assertNotAlreadyActiveMember(
  ctx: MutationCtx,
  team: Doc<"teams">,
  userId: Id<"users">,
): Promise<void> {
  const role = await getEffectiveTeamRole(ctx, team, userId);
  if (role !== null) throw new Error("Already a member");
}

async function assertEmailNotActiveMember(
  ctx: MutationCtx,
  team: Doc<"teams">,
  normalizedEmail: string,
): Promise<void> {
  const members = await ctx.db
    .query("teamMembers")
    .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();
  for (const m of members) {
    const u = await ctx.db.get(m.userId);
    const em = u?.email;
    if (em && normalizeEmail(em) === normalizedEmail) {
      throw new Error("User is already a member");
    }
  }
}

function parseInviteRole(role: TeamRole | undefined): TeamRole {
  const r = role ?? "pilot";
  if (r === "captain") throw new Error("Cannot invite with captain role");
  return r;
}

export const createInvite = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.optional(v.string()),
    invitedUserId: v.optional(v.id("users")),
    role: v.optional(teamRoleValidator),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const actorId = await requireAuth(ctx);
    await requireCapability(ctx, args.teamId, "invite_members");
    const team = await loadTeamOrThrow(ctx, args.teamId);

    const rawEmail = args.email?.trim();
    const hasEmail = rawEmail !== undefined && rawEmail.length > 0;
    const hasUser = args.invitedUserId !== undefined;
    if (!hasEmail && !hasUser) {
      throw new Error("email or invitedUserId required");
    }
    if (hasEmail && hasUser) {
      throw new Error("Provide only one of email or invitedUserId");
    }

    const inviteRole = parseInviteRole(args.role);
    const now = Date.now();
    const expiresAt =
      args.expiresAt !== undefined ? args.expiresAt : now + DEFAULT_INVITE_TTL_MS;
    if (expiresAt <= now) throw new Error("expiresAt must be in the future");

    if (hasUser) {
      const uid = args.invitedUserId!;
      if (uid === actorId) throw new Error("Cannot invite yourself");
      const target = await ctx.db.get(uid);
      if (!target) throw new Error("User not found");
      await assertNotAlreadyActiveMember(ctx, team, uid);
      await assertUserHasNoActiveTeamMembership(ctx, uid);

      const pending = await ctx.db
        .query("teamInvites")
        .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
        .collect();
      for (const inv of pending) {
        if (
          inv.acceptedAt === undefined &&
          inv.expiresAt > now &&
          inv.invitedUserId === uid
        ) {
          throw new Error("An invite is already pending for this user");
        }
      }
    } else {
      const normalized = normalizeEmail(rawEmail!);
      if (!normalized.includes("@")) throw new Error("Invalid email");
      await assertEmailNotActiveMember(ctx, team, normalized);

      const existingForEmail = await ctx.db
        .query("teamInvites")
        .withIndex("by_email_and_teamId", (q) =>
          q.eq("email", normalized).eq("teamId", args.teamId),
        )
        .collect();
      for (const inv of existingForEmail) {
        if (inv.acceptedAt === undefined && inv.expiresAt > now) {
          throw new Error("An invite is already pending for this email");
        }
      }
    }

    const token = generateInviteToken();
    const tokenHash = await hashInviteToken(token);

    await ctx.db.insert("teamInvites", {
      teamId: args.teamId,
      email: hasEmail ? normalizeEmail(rawEmail!) : undefined,
      invitedUserId: hasUser ? args.invitedUserId : undefined,
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

export const acceptInvite = mutation({
  args: { token: v.string() },
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
    const now = Date.now();
    if (invite.expiresAt <= now) throw new Error("Invite has expired");

    const team = await loadTeamOrThrow(ctx, invite.teamId);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    let matches = false;
    if (invite.invitedUserId !== undefined && invite.invitedUserId === userId) {
      matches = true;
    }
    if (invite.email !== undefined && user.email !== undefined) {
      if (normalizeEmail(user.email) === invite.email) matches = true;
    }
    if (!matches) throw new Error("This invite is for a different account");

    const existingRole = await getEffectiveTeamRole(ctx, team, userId);
    if (existingRole !== null) throw new Error("Already a member");

    await assertUserHasNoActiveTeamMembership(ctx, userId);

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
