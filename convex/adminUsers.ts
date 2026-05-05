import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { buildAdminSearchText, isAdminRole } from "./lib/accountStatus";
import { requireAdmin } from "./utils/validation";

const accountStatusFilterValidator = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("banned"),
  v.literal("write_restricted"),
  v.literal("all")
);

const roleFilterValidator = v.union(
  v.literal("Admin"),
  v.literal("user"),
  v.literal("all")
);

const triStateValidator = v.union(
  v.literal("yes"),
  v.literal("no"),
  v.literal("all")
);

const directoryUserValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  username: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  role: v.optional(v.string()),
  isAnonymous: v.optional(v.boolean()),
  accountStatus: v.union(
    v.literal("active"),
    v.literal("suspended"),
    v.literal("banned"),
    v.literal("write_restricted")
  ),
  hasVerifiedEmail: v.boolean(),
});

const moderationLogRowValidator = v.object({
  _id: v.id("moderationAuditLog"),
  _creationTime: v.number(),
  actorId: v.id("users"),
  targetUserId: v.optional(v.id("users")),
  action: v.string(),
  payload: v.optional(v.string()),
});

type FilterState = {
  accountStatus: "active" | "suspended" | "banned" | "write_restricted" | "all";
  role: "Admin" | "user" | "all";
  hasVerifiedEmail: "yes" | "no" | "all";
  isAnonymous: "yes" | "no" | "all";
};

function matchesFilters(u: Doc<"users">, filters: FilterState) {
  const st = (u.accountStatus ?? "active") as
    | "active"
    | "suspended"
    | "banned"
    | "write_restricted";
  if (filters.accountStatus !== "all" && st !== filters.accountStatus) {
    return false;
  }
  if (filters.role !== "all") {
    const r = isAdminRole(u.role) ? "Admin" : "user";
    if (r !== filters.role) return false;
  }
  if (filters.hasVerifiedEmail !== "all") {
    const verified = u.hasVerifiedEmail ?? (u.emailVerificationTime !== undefined);
    if (filters.hasVerifiedEmail === "yes" && !verified) return false;
    if (filters.hasVerifiedEmail === "no" && verified) return false;
  }
  if (filters.isAnonymous !== "all") {
    const anon = u.isAnonymous === true;
    if (filters.isAnonymous === "yes" && !anon) return false;
    if (filters.isAnonymous === "no" && anon) return false;
  }
  return true;
}

function toDirectoryUser(u: Doc<"users">) {
  return {
    _id: u._id,
    _creationTime: u._creationTime,
    username: u.username,
    email: u.email,
    emailVerificationTime: u.emailVerificationTime,
    role: u.role,
    isAnonymous: u.isAnonymous,
    accountStatus: (u.accountStatus ?? "active") as
      | "active"
      | "suspended"
      | "banned"
      | "write_restricted",
    hasVerifiedEmail: u.hasVerifiedEmail ?? (u.emailVerificationTime !== undefined),
  };
}

async function appendModerationLog(
  ctx: MutationCtx,
  entry: {
    actorId: Id<"users">;
    targetUserId?: Id<"users">;
    action: string;
    payload?: string;
  }
) {
  await ctx.db.insert("moderationAuditLog", {
    actorId: entry.actorId,
    targetUserId: entry.targetUserId,
    action: entry.action,
    payload: entry.payload,
  });
}

async function countAdmins(ctx: MutationCtx) {
  const rows = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "Admin"))
    .collect();
  return rows.length;
}

export const runUserDirectoryBackfillBatch = mutation({
  args: { limit: v.optional(v.number()) },
  returns: v.object({ processed: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const n = Math.min(args.limit ?? 200, 500);
    const batch = await ctx.db.query("users").order("desc").take(n);
    let processed = 0;
    for (const u of batch) {
      const status = u.accountStatus ?? "active";
      const search = buildAdminSearchText(u);
      const hasVerified = u.emailVerificationTime !== undefined;
      if (
        u.accountStatus === undefined ||
        u.adminSearchText !== search ||
        u.hasVerifiedEmail !== hasVerified
      ) {
        await ctx.db.patch(u._id, {
          accountStatus: status,
          adminSearchText: search,
          hasVerifiedEmail: hasVerified,
        });
        processed += 1;
      }
    }
    return { processed };
  },
});

export const listDirectory = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    accountStatus: v.optional(accountStatusFilterValidator),
    role: v.optional(roleFilterValidator),
    hasVerifiedEmail: v.optional(triStateValidator),
    isAnonymous: v.optional(triStateValidator),
  },
  returns: v.object({
    page: v.array(directoryUserValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const numItems = Math.min(Math.max(args.paginationOpts.numItems, 1), 50);
    const searchTerm = (args.search ?? "").trim();
    const accountStatus = args.accountStatus ?? "all";
    const role = args.role ?? "all";
    const hasVerifiedEmail = args.hasVerifiedEmail ?? "all";
    const isAnonymous = args.isAnonymous ?? "all";
    const filters: FilterState = { accountStatus, role, hasVerifiedEmail, isAnonymous };
    if (searchTerm.length > 0) {
      const r = await ctx.db
        .query("users")
        .withSearchIndex("search_admin_users", (q) => {
          let chain = q.search("adminSearchText", searchTerm);
          if (accountStatus !== "all") {
            chain = chain.eq("accountStatus", accountStatus);
          }
          if (hasVerifiedEmail !== "all") {
            chain = chain.eq("hasVerifiedEmail", hasVerifiedEmail === "yes");
          }
          if (role === "Admin") {
            chain = chain.eq("role", "Admin");
          }
          return chain;
        })
        .paginate({ numItems, cursor: args.paginationOpts.cursor ?? null });
      const page = r.page
        .filter((u) => matchesFilters(u, filters))
        .map(toDirectoryUser);
      return { page, isDone: r.isDone, continueCursor: r.continueCursor };
    }
    let cursor: string | null = args.paginationOpts.cursor ?? null;
    const out: ReturnType<typeof toDirectoryUser>[] = [];
    let isDone = false;
    let lastContinue = "";
    while (out.length < numItems) {
      const result = await ctx.db
        .query("users")
        .order("desc")
        .paginate({ numItems: 80, cursor });
      for (const u of result.page) {
        if (matchesFilters(u, filters)) {
          out.push(toDirectoryUser(u));
          if (out.length >= numItems) break;
        }
      }
      isDone = result.isDone;
      lastContinue = result.continueCursor;
      cursor = result.continueCursor;
      if (result.isDone) break;
      if (out.length >= numItems) break;
    }
    return { page: out, isDone, continueCursor: lastContinue };
  },
});

const detailUserValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  username: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  image: v.optional(v.string()),
  isAnonymous: v.optional(v.boolean()),
  role: v.optional(v.string()),
  profanityFilterEnabled: v.boolean(),
  accountStatus: v.union(
    v.literal("active"),
    v.literal("suspended"),
    v.literal("banned"),
    v.literal("write_restricted")
  ),
  statusReason: v.optional(v.string()),
  statusSetAt: v.optional(v.number()),
  statusSetBy: v.optional(v.id("users")),
  statusExpiresAt: v.optional(v.number()),
  userFacingMessage: v.optional(v.string()),
});

export const getUserAdminDetail = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      user: detailUserValidator,
      deckCount: v.number(),
      deckCountCapped: v.boolean(),
      tierListCount: v.number(),
      tierListCountCapped: v.boolean(),
      commentCount: v.number(),
      commentCountCapped: v.boolean(),
      teamChatMessageCount: v.number(),
      teamChatMessageCountCapped: v.boolean(),
      pendingTierListIds: v.array(v.id("tierLists")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const u = await ctx.db.get(args.userId);
    if (!u) return null;
    const user = {
      _id: u._id,
      _creationTime: u._creationTime,
      username: u.username,
      email: u.email,
      emailVerificationTime: u.emailVerificationTime,
      image: u.image,
      isAnonymous: u.isAnonymous,
      role: u.role,
      profanityFilterEnabled: u.profanityFilterEnabled !== false,
      accountStatus: (u.accountStatus ?? "active") as
        | "active"
        | "suspended"
        | "banned"
        | "write_restricted",
      statusReason: u.statusReason,
      statusSetAt: u.statusSetAt,
      statusSetBy: u.statusSetBy,
      statusExpiresAt: u.statusExpiresAt,
      userFacingMessage: u.userFacingMessage,
    };
    const deckRows = await ctx.db
      .query("decks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(501);
    const tierRows = await ctx.db
      .query("tierLists")
      .withIndex("by_user_and_updatedAt", (q) => q.eq("userId", args.userId))
      .take(501);
    const commentRows = await ctx.db
      .query("tierListComments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(501);
    const chatRows = await ctx.db
      .query("teamChatMessages")
      .withIndex("by_authorUserId", (q) => q.eq("authorUserId", args.userId))
      .take(501);
    const pending = await ctx.db
      .query("tierLists")
      .withIndex("by_userId_and_listModerationStatus", (q) =>
        q.eq("userId", args.userId).eq("listModerationStatus", "pending")
      )
      .take(50);
    return {
      user,
      deckCount: Math.min(deckRows.length, 500),
      deckCountCapped: deckRows.length > 500,
      tierListCount: Math.min(tierRows.length, 500),
      tierListCountCapped: tierRows.length > 500,
      commentCount: Math.min(commentRows.length, 500),
      commentCountCapped: commentRows.length > 500,
      teamChatMessageCount: Math.min(chatRows.length, 500),
      teamChatMessageCountCapped: chatRows.length > 500,
      pendingTierListIds: pending.map((p) => p._id),
    };
  },
});

export const listModerationAudit = query({
  args: {
    paginationOpts: paginationOptsValidator,
    targetUserId: v.optional(v.id("users")),
  },
  returns: v.object({
    page: v.array(moderationLogRowValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const numItems = Math.min(Math.max(args.paginationOpts.numItems, 1), 100);
    if (args.targetUserId) {
      return await ctx.db
        .query("moderationAuditLog")
        .withIndex("by_targetUser", (q) => q.eq("targetUserId", args.targetUserId))
        .order("desc")
        .paginate({ numItems, cursor: args.paginationOpts.cursor ?? null });
    }
    return await ctx.db
      .query("moderationAuditLog")
      .order("desc")
      .paginate({ numItems, cursor: args.paginationOpts.cursor ?? null });
  },
});

const setStatusInputValidator = v.object({
  targetUserId: v.id("users"),
  nextStatus: v.union(
    v.literal("active"),
    v.literal("suspended"),
    v.literal("banned"),
    v.literal("write_restricted")
  ),
  statusReason: v.optional(v.string()),
  userFacingMessage: v.optional(v.string()),
  statusExpiresAt: v.optional(v.number()),
});

export const setAccountStatus = mutation({
  args: setStatusInputValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx);
    if (args.targetUserId === actorId) {
      throw new Error("You cannot change your own account status here.");
    }
    const target = await ctx.db.get(args.targetUserId);
    if (!target) throw new Error("User not found");
    if (isAdminRole(target.role) && args.nextStatus !== "active") {
      const n = await countAdmins(ctx);
      if (n <= 1) {
        throw new Error("The last admin account cannot be restricted.");
      }
    }
    const now = Date.now();
    if (args.nextStatus === "active") {
      await ctx.db.patch(args.targetUserId, {
        accountStatus: "active",
        statusSetAt: now,
        statusSetBy: actorId,
        statusReason: undefined,
        userFacingMessage: undefined,
        statusExpiresAt: undefined,
      });
    } else {
      await ctx.db.patch(args.targetUserId, {
        accountStatus: args.nextStatus,
        statusSetAt: now,
        statusSetBy: actorId,
        statusReason: args.statusReason,
        userFacingMessage: args.userFacingMessage,
        statusExpiresAt: args.statusExpiresAt,
      });
    }
    const t2 = await ctx.db.get(args.targetUserId);
    if (t2) {
      await ctx.db.patch(args.targetUserId, {
        adminSearchText: buildAdminSearchText(t2),
        hasVerifiedEmail: t2.emailVerificationTime !== undefined,
      });
    }
    await appendModerationLog(ctx, {
      actorId,
      targetUserId: args.targetUserId,
      action: "setAccountStatus",
      payload: JSON.stringify({
        nextStatus: args.nextStatus,
        statusReason: args.statusReason,
        userFacingMessage: args.userFacingMessage,
        statusExpiresAt: args.statusExpiresAt,
      }),
    });
    return null;
  },
});

export const setUserRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(v.literal("Admin"), v.literal("user")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx);
    if (args.targetUserId === actorId && args.role === "user") {
      const n = await countAdmins(ctx);
      if (n <= 1) {
        throw new Error("The last admin cannot be demoted.");
      }
    }
    const target = await ctx.db.get(args.targetUserId);
    if (!target) throw new Error("User not found");
    if (isAdminRole(target.role) && args.role === "user") {
      const n = await countAdmins(ctx);
      if (n <= 1) {
        throw new Error("The last admin cannot be demoted.");
      }
    }
    await ctx.db.patch(args.targetUserId, {
      role: args.role === "Admin" ? "Admin" : undefined,
    });
    const t2 = await ctx.db.get(args.targetUserId);
    if (t2) {
      await ctx.db.patch(args.targetUserId, {
        adminSearchText: buildAdminSearchText(t2),
      });
    }
    await appendModerationLog(ctx, {
      actorId,
      targetUserId: args.targetUserId,
      action: "setUserRole",
      payload: JSON.stringify({ role: args.role }),
    });
    return null;
  },
});

export const bulkSetTierListListModeration = mutation({
  args: {
    tierListIds: v.array(v.id("tierLists")),
    listModerationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actorId = await requireAdmin(ctx);
    for (const id of args.tierListIds) {
      const tl = await ctx.db.get(id);
      if (tl) {
        await ctx.db.patch(id, { listModerationStatus: args.listModerationStatus });
      }
    }
    await appendModerationLog(ctx, {
      actorId,
      action: "bulkSetTierListListModeration",
      payload: JSON.stringify({
        tierListIds: args.tierListIds,
        listModerationStatus: args.listModerationStatus,
      }),
    });
    return null;
  },
});
