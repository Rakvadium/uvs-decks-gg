import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { getEffectiveTeamRole, hasCapability } from "./permissions";
import { deckTeamCollaborationValidator } from "../validators";

const collaborationFilterValidator = v.union(
  v.literal("all"),
  v.literal("team_viewable"),
  v.literal("team_editable"),
);

const aggregatedDeckEntryValidator = v.object({
  _id: v.id("decks"),
  name: v.string(),
  userId: v.id("users"),
  teamId: v.id("teams"),
  teamName: v.string(),
  teamCollaboration: v.optional(deckTeamCollaborationValidator),
  ownerUsername: v.optional(v.string()),
});

const deckListEntryValidator = v.object({
  _id: v.id("decks"),
  name: v.string(),
  userId: v.id("users"),
  teamCollaboration: v.optional(deckTeamCollaborationValidator),
  ownerUsername: v.optional(v.string()),
});

const listReturns = v.union(
  v.null(),
  v.object({
    decks: v.array(deckListEntryValidator),
    canCreateTeamDeck: v.boolean(),
  }),
);

function collabMode(
  row: { teamCollaboration?: "none" | "team_viewable" | "team_editable" },
  filter: "all" | "team_viewable" | "team_editable",
): boolean {
  const mode = row.teamCollaboration;
  if (mode === "none") return false;
  if (filter === "all") {
    return mode === "team_viewable" || mode === "team_editable" || mode === undefined;
  }
  if (filter === "team_viewable") {
    return mode === "team_viewable" || mode === undefined;
  }
  return mode === "team_editable";
}

export const listForHub = query({
  args: {
    teamId: v.id("teams"),
    collaboration: collaborationFilterValidator,
  },
  returns: listReturns,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;
    const viewerRole = await getEffectiveTeamRole(ctx, team, userId);
    if (viewerRole === null) return null;
    if (!hasCapability(viewerRole, "view_team_decks")) {
      return null;
    }
    const raw = await ctx.db
      .query("decks")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
    const deckRows = raw.filter(
      (d) => d.visibility === "team" && d.teamId === args.teamId && collabMode(d, args.collaboration),
    );
    deckRows.sort((a, b) => b._creationTime - a._creationTime);
    const ownerIds = [...new Set(deckRows.map((d) => d.userId))] as Id<"users">[];
    const userMap = new Map<Id<"users">, { username?: string }>();
    for (const oid of ownerIds) {
      const u = await ctx.db.get(oid);
      if (u) userMap.set(oid, { username: u.username ?? undefined });
    }
    const decks = deckRows.map((d) => ({
      _id: d._id,
      name: d.name,
      userId: d.userId,
      teamCollaboration: d.teamCollaboration,
      ownerUsername: userMap.get(d.userId)?.username,
    }));
    return {
      decks,
      canCreateTeamDeck: hasCapability(viewerRole, "create_team_deck"),
    };
  },
});

export const listAggregatedForMyTeams = query({
  args: { collaboration: collaborationFilterValidator },
  returns: v.array(aggregatedDeckEntryValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
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
    const rows: { deck: Doc<"decks">; teamId: Id<"teams">; teamName: string }[] = [];
    for (const teamId of teamIds) {
      const team = await ctx.db.get(teamId);
      if (!team) continue;
      const viewerRole = await getEffectiveTeamRole(ctx, team, userId);
      if (viewerRole === null || !hasCapability(viewerRole, "view_team_decks")) continue;
      const raw = await ctx.db
        .query("decks")
        .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
        .collect();
      const deckRows = raw.filter(
        (d) => d.visibility === "team" && d.teamId === teamId && collabMode(d, args.collaboration),
      );
      for (const d of deckRows) {
        rows.push({ deck: d, teamId, teamName: team.name });
      }
    }
    rows.sort((a, b) => b.deck._creationTime - a.deck._creationTime);
    const ownerIds = [...new Set(rows.map((r) => r.deck.userId))] as Id<"users">[];
    const userMap = new Map<Id<"users">, { username?: string }>();
    for (const oid of ownerIds) {
      const u = await ctx.db.get(oid);
      if (u) userMap.set(oid, { username: u.username ?? undefined });
    }
    return rows.map((r) => ({
      _id: r.deck._id,
      name: r.deck.name,
      userId: r.deck.userId,
      teamId: r.teamId,
      teamName: r.teamName,
      teamCollaboration: r.deck.teamCollaboration,
      ownerUsername: userMap.get(r.deck.userId)?.username,
    }));
  },
});
