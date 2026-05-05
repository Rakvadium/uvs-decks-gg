import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { requireAuth } from "../utils/validation";
import { teamValidator } from "../validators";

export const ALL_TEAM_CAPABILITIES = [
  "view_team",
  "view_team_decks",
  "view_team_stats",
  "create_team_deck",
  "share_team_deck",
  "post_team_chat",
  "post_team_announcements",
  "pin_team_announcements",
  "moderate_team_chat",
  "manage_team_events",
  "invite_members",
  "manage_members",
  "assign_roles",
  "remove_members",
  "edit_team_settings",
  "transfer_captaincy",
  "delete_team",
] as const;

export type TeamCapability = (typeof ALL_TEAM_CAPABILITIES)[number];

export const TEAM_ROLES = [
  "captain",
  "co_captain",
  "architect",
  "analyst",
  "scout",
  "pilot",
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

const BASE: TeamCapability[] = [
  "view_team",
  "view_team_decks",
  "view_team_stats",
  "create_team_deck",
  "share_team_deck",
  "post_team_chat",
  "post_team_announcements",
];

const HUB_LEAD: TeamCapability[] = [
  "pin_team_announcements",
  "moderate_team_chat",
  "manage_team_events",
];

const MGMT: TeamCapability[] = [
  "invite_members",
  "manage_members",
  "assign_roles",
  "remove_members",
];

const CAPT: TeamCapability[] = [
  "edit_team_settings",
  "transfer_captaincy",
  "delete_team",
];

const BY_ROLE: Record<TeamRole, ReadonlySet<TeamCapability>> = {
  pilot: new Set([...BASE]),
  scout: new Set([...BASE]),
  analyst: new Set([...BASE]),
  architect: new Set([...BASE]),
  co_captain: new Set([...BASE, ...MGMT, ...HUB_LEAD]),
  captain: new Set([...BASE, ...MGMT, ...CAPT, ...HUB_LEAD]),
};

export function hasCapability(role: TeamRole, capability: TeamCapability): boolean {
  return BY_ROLE[role].has(capability);
}

export async function getActiveMembership(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
) {
  const row = await ctx.db
    .query("teamMembers")
    .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", teamId).eq("userId", userId))
    .unique();
  if (!row || row.status !== "active") return null;
  return row;
}

export async function getEffectiveTeamRole(
  ctx: QueryCtx | MutationCtx,
  team: Doc<"teams">,
  userId: Id<"users">,
): Promise<TeamRole | null> {
  if (userId === team.captainUserId) {
    return "captain";
  }
  const member = await getActiveMembership(ctx, team._id, userId);
  if (!member) return null;
  return member.role;
}

export async function getTeamViewerOrNull(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
): Promise<{ userId: Id<"users">; team: Doc<"teams">; role: TeamRole } | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }
  const team = await ctx.db.get(teamId);
  if (!team) {
    return null;
  }
  const role = await getEffectiveTeamRole(ctx, team, userId);
  if (role === null || !hasCapability(role, "view_team")) {
    return null;
  }
  return { userId, team, role };
}

export async function requireCapability(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  capability: TeamCapability,
) {
  const userId = await requireAuth(ctx);
  const team = await ctx.db.get(teamId);
  if (!team) {
    throw new Error("Team not found");
  }
  const role = await getEffectiveTeamRole(ctx, team, userId);
  if (role === null) {
    throw new Error("Not a team member");
  }
  if (!hasCapability(role, capability)) {
    throw new Error("Insufficient permissions");
  }
  return { userId, team, role } as const;
}

export async function requireCaptain(ctx: QueryCtx | MutationCtx, teamId: Id<"teams">) {
  const userId = await requireAuth(ctx);
  const team = await ctx.db.get(teamId);
  if (!team) {
    throw new Error("Team not found");
  }
  if (team.captainUserId !== userId) {
    throw new Error("Captain only");
  }
  return { userId, team } as const;
}

export async function assertUserHasNoActiveTeamMembership(ctx: MutationCtx, userId: Id<"users">) {
  const active = await ctx.db
    .query("teamMembers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();
  if (active.length > 0) {
    throw new Error("You already belong to a team");
  }
}

async function collectTeamsForUser(ctx: QueryCtx, userId: Id<"users">): Promise<Doc<"teams">[]> {
  const fromCaptain = await ctx.db
    .query("teams")
    .withIndex("by_captainUserId", (q) => q.eq("captainUserId", userId))
    .collect();
  const memberships = await ctx.db
    .query("teamMembers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();
  const teamIds = new Set<Id<"teams">>();
  for (const t of fromCaptain) {
    teamIds.add(t._id);
  }
  for (const m of memberships) {
    teamIds.add(m.teamId);
  }
  const teams: Doc<"teams">[] = [];
  for (const id of teamIds) {
    const t = await ctx.db.get(id);
    if (t) teams.push(t);
  }
  teams.sort((a, b) => a.name.localeCompare(b.name));
  return teams;
}

export const assertUserCanPostTeamChat = internalQuery({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }
    const role = await getEffectiveTeamRole(ctx, team, args.userId);
    if (role === null) {
      throw new Error("Not a team member");
    }
    if (!hasCapability(role, "post_team_chat")) {
      throw new Error("Insufficient permissions");
    }
    return null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("teams"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await assertUserHasNoActiveTeamMembership(ctx, userId);
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Name is required");
    }
    if (args.slug !== undefined) {
      const s = args.slug.trim();
      if (s.length > 0) {
        const existing = await ctx.db
          .query("teams")
          .withIndex("by_slug", (q) => q.eq("slug", s))
          .unique();
        if (existing) {
          throw new Error("Slug already in use");
        }
      }
    }
    const now = Date.now();
    const teamId = await ctx.db.insert("teams", {
      name,
      slug: args.slug !== undefined && args.slug.trim().length > 0 ? args.slug.trim() : undefined,
      captainUserId: userId,
      description: args.description,
      imageStorageId: args.imageStorageId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "captain",
      joinedAt: now,
      status: "active",
    });
    return teamId;
  },
});

export const updateSettings = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    slug: v.optional(v.union(v.string(), v.null())),
    description: v.optional(v.union(v.string(), v.null())),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { team } = await requireCaptain(ctx, args.teamId);
    const patch: Partial<Doc<"teams">> = { updatedAt: Date.now() };
    if (args.name !== undefined) {
      const n = args.name.trim();
      if (n.length === 0) {
        throw new Error("Name cannot be empty");
      }
      patch.name = n;
    }
    if (args.slug !== undefined) {
      if (args.slug === null) {
        patch.slug = undefined;
      } else {
        const s = args.slug.trim();
        if (s.length === 0) {
          patch.slug = undefined;
        } else {
          const existing = await ctx.db
            .query("teams")
            .withIndex("by_slug", (q) => q.eq("slug", s))
            .unique();
          if (existing && existing._id !== team._id) {
            throw new Error("Slug already in use");
          }
          patch.slug = s;
        }
      }
    }
    if (args.description !== undefined) {
      patch.description = args.description === null ? undefined : args.description;
    }
    if (args.imageStorageId !== undefined) {
      patch.imageStorageId = args.imageStorageId === null ? undefined : args.imageStorageId;
    }
    if (
      args.name === undefined &&
      args.slug === undefined &&
      args.description === undefined &&
      args.imageStorageId === undefined
    ) {
      throw new Error("No changes");
    }
    await ctx.db.patch(team._id, patch);
    return null;
  },
});

export const dissolve = mutation({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireCaptain(ctx, args.teamId);
    const teamId = args.teamId;
    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
      .collect();
    for (const inv of invites) {
      await ctx.db.delete(inv._id);
    }
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }
    const announcements = await ctx.db
      .query("teamAnnouncements")
      .withIndex("by_teamId_and_createdAt", (q) => q.eq("teamId", teamId))
      .collect();
    for (const row of announcements) {
      await ctx.db.delete(row._id);
    }
    const chatMessages = await ctx.db
      .query("teamChatMessages")
      .withIndex("by_teamId_and_createdAt", (q) => q.eq("teamId", teamId))
      .collect();
    for (const row of chatMessages) {
      await ctx.db.delete(row._id);
    }
    const teamEvents = await ctx.db
      .query("teamEvents")
      .withIndex("by_teamId_and_startsAt", (q) => q.eq("teamId", teamId))
      .collect();
    for (const row of teamEvents) {
      await ctx.db.delete(row._id);
    }
    const mediaRows = await ctx.db
      .query("mediaAssets")
      .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
      .collect();
    for (const row of mediaRows) {
      await ctx.storage.delete(row.storageId);
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(teamId);
    return null;
  },
});

export const getTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.union(teamValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;
    const role = await getEffectiveTeamRole(ctx, team, userId);
    if (role === null) return null;
    if (!hasCapability(role, "view_team")) {
      return null;
    }
    return team;
  },
});

export const listMyTeams = query({
  args: {},
  returns: v.array(teamValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const teams = await collectTeamsForUser(ctx, userId);
    return teams.slice(0, 1);
  },
});

export const getMyTeam = query({
  args: {},
  returns: v.union(teamValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const teams = await collectTeamsForUser(ctx, userId);
    return teams[0] ?? null;
  },
});
