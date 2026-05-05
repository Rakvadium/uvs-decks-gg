import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { teamAnnouncementValidator } from "../validators";
import { getTeamViewerOrNull, hasCapability, requireCapability } from "./permissions";
import { requireUserCanPostContent } from "../utils/validation";

const announcementWithAuthorValidator = v.object({
  announcement: teamAnnouncementValidator,
  authorUsername: v.optional(v.string()),
});

export const listPinned = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.union(v.null(), v.array(announcementWithAuthorValidator)),
  handler: async (ctx, args) => {
    const viewer = await getTeamViewerOrNull(ctx, args.teamId);
    if (!viewer) {
      return null;
    }
    const rows = await ctx.db
      .query("teamAnnouncements")
      .withIndex("by_teamId_and_createdAt", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("pinned"), true))
      .order("desc")
      .take(50);
    const out: Array<{
      announcement: (typeof rows)[0];
      authorUsername?: string;
    }> = [];
    for (const announcement of rows) {
      const u = await ctx.db.get(announcement.authorUserId);
      out.push({
        announcement,
        authorUsername: u?.username ?? undefined,
      });
    }
    return out;
  },
});

export const listUnpinnedPage = query({
  args: {
    teamId: v.id("teams"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(announcementWithAuthorValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const viewer = await getTeamViewerOrNull(ctx, args.teamId);
    if (!viewer) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    const numItems = Math.min(Math.max(args.paginationOpts.numItems, 1), 50);
    const allInTeam = await ctx.db
      .query("teamAnnouncements")
      .withIndex("by_teamId_and_createdAt", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("pinned"), false))
      .order("desc")
      .paginate({ numItems, cursor: args.paginationOpts.cursor });
    const page: Array<{
      announcement: (typeof allInTeam.page)[0];
      authorUsername?: string;
    }> = [];
    for (const announcement of allInTeam.page) {
      const u = await ctx.db.get(announcement.authorUserId);
      page.push({
        announcement,
        authorUsername: u?.username ?? undefined,
      });
    }
    return {
      page,
      isDone: allInTeam.isDone,
      continueCursor: allInTeam.continueCursor,
    };
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    body: v.string(),
  },
  returns: v.id("teamAnnouncements"),
  handler: async (ctx, args) => {
    const { userId } = await requireCapability(ctx, args.teamId, "post_team_announcements");
    await requireUserCanPostContent(ctx, userId);
    const title = args.title.trim();
    if (title.length === 0) {
      throw new Error("Title is required");
    }
    if (title.length > 200) {
      throw new Error("Title is too long");
    }
    const body = args.body.trim();
    if (body.length === 0) {
      throw new Error("Body is required");
    }
    if (body.length > 20000) {
      throw new Error("Body is too long");
    }
    const now = Date.now();
    return await ctx.db.insert("teamAnnouncements", {
      teamId: args.teamId,
      authorUserId: userId,
      title,
      body,
      pinned: false,
      createdAt: now,
    });
  },
});

export const update = mutation({
  args: {
    announcementId: v.id("teamAnnouncements"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.announcementId);
    if (!row) {
      throw new Error("Announcement not found");
    }
    const viewer = await getTeamViewerOrNull(ctx, row.teamId);
    if (!viewer) {
      throw new Error("Not a team member");
    }
    const { userId, role } = viewer;
    if (args.pinned !== undefined) {
      if (!hasCapability(role, "pin_team_announcements")) {
        throw new Error("Only co-captains and the captain can pin announcements");
      }
    }
    if (args.title !== undefined || args.body !== undefined) {
      if (row.authorUserId !== userId) {
        throw new Error("You can only edit your own announcements");
      }
      if (!hasCapability(role, "post_team_announcements")) {
        throw new Error("Insufficient permissions");
      }
      await requireUserCanPostContent(ctx, userId);
    }
    const patch: { title?: string; body?: string; pinned?: boolean } = {};
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
    if (args.body !== undefined) {
      const b = args.body.trim();
      if (b.length === 0) {
        throw new Error("Body cannot be empty");
      }
      if (b.length > 20000) {
        throw new Error("Body is too long");
      }
      patch.body = b;
    }
    if (args.pinned !== undefined) {
      patch.pinned = args.pinned;
    }
    if (Object.keys(patch).length === 0) {
      throw new Error("No changes");
    }
    await ctx.db.patch(args.announcementId, patch);
    return null;
  },
});

export const remove = mutation({
  args: {
    announcementId: v.id("teamAnnouncements"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.announcementId);
    if (!row) {
      throw new Error("Announcement not found");
    }
    const viewer = await getTeamViewerOrNull(ctx, row.teamId);
    if (!viewer) {
      throw new Error("Not a team member");
    }
    const { userId, role } = viewer;
    if (row.authorUserId === userId) {
      await requireUserCanPostContent(ctx, userId);
      await ctx.db.delete(args.announcementId);
      return null;
    }
    if (!hasCapability(role, "moderate_team_chat")) {
      throw new Error("You cannot delete this announcement");
    }
    await ctx.db.delete(args.announcementId);
    return null;
  },
});
