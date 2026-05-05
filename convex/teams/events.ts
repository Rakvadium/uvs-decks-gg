import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { teamEventValidator } from "../validators";
import { getTeamViewerOrNull, requireCapability } from "./permissions";

const eventWithCreatorNameValidator = v.object({
  event: teamEventValidator,
  creatorUsername: v.optional(v.string()),
});

export const listForHub = query({
  args: {
    teamId: v.id("teams"),
    limit: v.optional(v.number()),
  },
  returns: v.union(v.null(), v.array(eventWithCreatorNameValidator)),
  handler: async (ctx, args) => {
    const viewer = await getTeamViewerOrNull(ctx, args.teamId);
    if (!viewer) {
      return null;
    }
    const cap = Math.min(Math.max(args.limit ?? 200, 1), 500);
    const raw = await ctx.db
      .query("teamEvents")
      .withIndex("by_teamId_and_startsAt", (q) => q.eq("teamId", args.teamId))
      .order("asc")
      .take(cap);
    const out: Array<{
      event: (typeof raw)[0];
      creatorUsername?: string;
    }> = [];
    for (const event of raw) {
      const u = await ctx.db.get(event.createdByUserId);
      out.push({
        event,
        creatorUsername: u?.username ?? undefined,
      });
    }
    return out;
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
  },
  returns: v.id("teamEvents"),
  handler: async (ctx, args) => {
    const { userId } = await requireCapability(ctx, args.teamId, "manage_team_events");
    const title = args.title.trim();
    if (title.length === 0) {
      throw new Error("Title is required");
    }
    if (title.length > 200) {
      throw new Error("Title is too long");
    }
    if (args.endsAt !== undefined && args.endsAt < args.startsAt) {
      throw new Error("End time must be after start time");
    }
    const now = Date.now();
    return await ctx.db.insert("teamEvents", {
      teamId: args.teamId,
      title,
      description: args.description?.trim() || undefined,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      createdByUserId: userId,
      createdAt: now,
    });
  },
});

export const update = mutation({
  args: {
    eventId: v.id("teamEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.union(v.number(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.eventId);
    if (!row) {
      throw new Error("Event not found");
    }
    await requireCapability(ctx, row.teamId, "manage_team_events");
    const patch: {
      title?: string;
      description?: string;
      startsAt?: number;
      endsAt?: number;
    } = {};
    if (args.title !== undefined) {
      const t = args.title.trim();
      if (t.length === 0) {
        throw new Error("Title cannot be empty");
      }
      if (t.length > 200) {
        throw new Error("Title is too long");
      }
      patch.title = t;
    }
    if (args.description !== undefined) {
      patch.description = args.description === null ? undefined : args.description.trim() || undefined;
    }
    if (args.startsAt !== undefined) {
      patch.startsAt = args.startsAt;
    }
    if (args.endsAt !== undefined) {
      patch.endsAt = args.endsAt === null ? undefined : args.endsAt;
    }
    if (Object.keys(patch).length === 0) {
      throw new Error("No changes");
    }
    const nextStarts = patch.startsAt ?? row.startsAt;
    const nextEnds = patch.endsAt === undefined ? row.endsAt : patch.endsAt;
    if (nextEnds !== undefined && nextEnds < nextStarts) {
      throw new Error("End time must be after start time");
    }
    await ctx.db.patch(args.eventId, patch);
    return null;
  },
});

export const remove = mutation({
  args: {
    eventId: v.id("teamEvents"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.eventId);
    if (!row) {
      throw new Error("Event not found");
    }
    await requireCapability(ctx, row.teamId, "manage_team_events");
    await ctx.db.delete(args.eventId);
    return null;
  },
});
