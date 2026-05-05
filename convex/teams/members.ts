import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import {
  getEffectiveTeamRole,
  getActiveMembership,
  hasCapability,
  requireCapability,
  type TeamRole,
} from "./permissions";
import { teamRoleValidator } from "../validators";

const ROLE_ORDER: Record<TeamRole, number> = {
  captain: 0,
  co_captain: 1,
  architect: 2,
  analyst: 3,
  scout: 4,
  pilot: 5,
};

const ASSIGABLE_ROLES = new Set<TeamRole>([
  "co_captain",
  "architect",
  "analyst",
  "scout",
  "pilot",
]);

const memberRowValidator = v.object({
  memberId: v.id("teamMembers"),
  userId: v.id("users"),
  username: v.optional(v.string()),
  image: v.optional(v.string()),
  role: teamRoleValidator,
  joinedAt: v.number(),
  isCaptain: v.boolean(),
});

const listForHubReturns = v.union(
  v.null(),
  v.object({
    members: v.array(memberRowValidator),
    viewer: v.object({
      userId: v.id("users"),
      role: teamRoleValidator,
      canAssignRoles: v.boolean(),
    }),
  }),
);

export const listForHub = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: listForHubReturns,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;
    const viewerRole = await getEffectiveTeamRole(ctx, team, userId);
    if (viewerRole === null) return null;
    if (!hasCapability(viewerRole, "view_team")) {
      return null;
    }
    const rows = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    const members: Array<{
      memberId: (typeof rows)[0]["_id"];
      userId: Id<"users">;
      username?: string;
      image?: string;
      role: TeamRole;
      joinedAt: number;
      isCaptain: boolean;
    }> = [];
    for (const row of rows) {
      const u = await ctx.db.get(row.userId);
      const isCaptain = row.userId === team.captainUserId;
      members.push({
        memberId: row._id,
        userId: row.userId,
        username: u?.username ?? undefined,
        image: u?.image ?? undefined,
        role: row.role,
        joinedAt: row.joinedAt,
        isCaptain,
      });
    }
    members.sort((a, b) => {
      const ro = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
      if (ro !== 0) return ro;
      const an = (a.username ?? a.userId).toLowerCase();
      const bn = (b.username ?? b.userId).toLowerCase();
      return an.localeCompare(bn);
    });
    return {
      members,
      viewer: {
        userId,
        role: viewerRole,
        canAssignRoles: hasCapability(viewerRole, "assign_roles"),
      },
    };
  },
});

export const updateMemberRole = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: teamRoleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { team } = await requireCapability(ctx, args.teamId, "assign_roles");
    if (args.userId === team.captainUserId) {
      throw new Error("Cannot change the captain's role from here");
    }
    if (args.role === "captain") {
      throw new Error("Cannot assign the captain role");
    }
    const target = await getActiveMembership(ctx, args.teamId, args.userId);
    if (!target) {
      throw new Error("Member not found");
    }
    if (!ASSIGABLE_ROLES.has(args.role)) {
      throw new Error("Invalid role for assignment");
    }
    await ctx.db.patch(target._id, { role: args.role });
    return null;
  },
});
