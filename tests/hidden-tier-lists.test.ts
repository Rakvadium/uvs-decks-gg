import { describe, expect, test } from "bun:test";
import type { Id } from "../convex/_generated/dataModel";
import { bulkSetTierListListModeration } from "../convex/adminUsers";
import { recomputeScope } from "../convex/communityRankings";
import { assertPublicTierListCommentActor } from "../convex/tierListCommentInternal";
import {
  addComment,
  canViewTierList,
  getDetail,
  getEligibleRankingScopeRefs,
  listMine,
  listPublicFeed,
  toggleLike,
} from "../convex/tierLists";
import {
  isTierListHiddenByModeration,
  publicTierListFromDocument,
  publicTierListValidator,
  tierListValidator,
} from "../convex/validators";
import { buildCanonicalRankedTiers } from "../shared/app-config";

const ownerId = "j58owner" as Id<"users">;
const memberId = "j58member" as Id<"users">;
const adminId = "j58admin" as Id<"users">;
const bannedAdminId = "j58bannedadmin" as Id<"users">;
const voterId = "j58voter" as Id<"users">;

const approvedId = "k58approved" as Id<"tierLists">;
const legacyId = "k58legacy" as Id<"tierLists">;
const rejectedId = "k58rejected" as Id<"tierLists">;
const pendingId = "k58pending" as Id<"tierLists">;
const privateRejectedId = "k58privaterejected" as Id<"tierLists">;
const HIDDEN = [rejectedId, pendingId];

const rankedTiers = buildCanonicalRankedTiers();

function user(id: Id<"users">, extra: Record<string, unknown> = {}) {
  return { _id: id, _creationTime: 1, username: id, profanityFilterEnabled: false, ...extra };
}

/** A public, global-ranked list with one card in the top lane. `status` undefined = a row from before list moderation. */
function tierList(id: Id<"tierLists">, userId: Id<"users">, updatedAt: number, status?: string, isPublic = true) {
  return {
    _id: id,
    _creationTime: 1,
    userId,
    game: "uvs",
    title: id,
    isPublic,
    rankingScope: "global",
    rankingScopeKey: "global",
    selectedSetCodes: [],
    previewCardIds: [],
    tiers: rankedTiers,
    itemCount: 1,
    tierCount: rankedTiers.length,
    likeCount: 0,
    commentCount: 0,
    updatedAt,
    ...(status ? { listModerationStatus: status } : {}),
  };
}

type Row = Record<string, unknown> & { _id: string };

/**
 * Minimal in-memory ctx: index `eq` filters, `order("desc")` by updatedAt, async iteration, and the
 * writes the handlers under test make. Writes are recorded so tests can check them.
 */
function fakeCtx(signedInAs: Id<"users"> | null) {
  const tables: Record<string, Row[]> = {
    users: [
      user(ownerId),
      user(memberId),
      user(voterId),
      user(adminId, { role: "Admin" }),
      user(bannedAdminId, { role: "Admin", accountStatus: "banned" }),
    ],
    tierLists: [
      tierList(approvedId, memberId, 50, "approved"),
      tierList(legacyId, voterId, 40),
      tierList(rejectedId, ownerId, 30, "rejected"),
      tierList(pendingId, ownerId, 20, "pending"),
      tierList(privateRejectedId, ownerId, 10, "rejected", false),
    ],
    tierListItems: [approvedId, legacyId, rejectedId, pendingId, privateRejectedId].map((id, i) => ({
      _id: `item${i}`,
      _creationTime: 1,
      tierListId: id,
      cardId: `card${i}`,
      laneKey: rankedTiers[0].id,
      order: 0,
    })),
    tierListLikes: [],
    tierListComments: [],
    communityCardRankings: [],
    communityTierSnapshots: [],
    moderationAuditLog: [],
  };
  const inserted: Array<{ table: string; doc: Record<string, unknown> }> = [];
  const runMutationCalls: unknown[] = [];
  const findDoc = (id: string) => {
    for (const rows of Object.values(tables)) {
      const row = rows.find((r) => r._id === id);
      if (row) return row;
    }
    return null;
  };
  const chain = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    let descending = false;
    const rows = () => {
      const matched = (tables[table] ?? [])
        .filter((row) => filters.every(([f, v]) => row[f] === v))
        .map((row) => ({ ...row }));
      return descending
        ? [...matched].sort((a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0))
        : matched;
    };
    const c = {
      withIndex: (_name: string, build?: (q: unknown) => unknown) => {
        const q = {
          eq: (field: string, value: unknown) => {
            filters.push([field, value]);
            return q;
          },
        };
        build?.(q);
        return c;
      },
      order: (dir: string) => {
        descending = dir === "desc";
        return c;
      },
      take: async (n: number) => rows().slice(0, n),
      collect: async () => rows(),
      unique: async () => rows()[0] ?? null,
      first: async () => rows()[0] ?? null,
      async *[Symbol.asyncIterator]() {
        yield* rows();
      },
    };
    return c;
  };
  const ctx = {
    auth: {
      getUserIdentity: async () =>
        signedInAs ? { subject: `${signedInAs}|session`, tokenIdentifier: "t", issuer: "i" } : null,
    },
    db: {
      // Copies, like Convex: a later patch must not change a document a handler already read.
      get: async (id: string) => {
        const row = findDoc(id);
        return row ? { ...row } : null;
      },
      query: chain,
      patch: async (id: string, fields: Record<string, unknown>) => {
        Object.assign(findDoc(id) ?? {}, fields);
      },
      insert: async (table: string, doc: Record<string, unknown>) => {
        const _id = `${table}-${inserted.length}`;
        (tables[table] ??= []).push({ _id, _creationTime: 1, ...doc });
        inserted.push({ table, doc });
        return _id;
      },
      delete: async (id: string) => {
        for (const [name, rows] of Object.entries(tables)) tables[name] = rows.filter((r) => r._id !== id);
      },
    },
    scheduler: {},
    runMutation: async (_ref: unknown, args: unknown) => {
      runMutationCalls.push(args);
      return null;
    },
  };
  return { ctx, inserted, runMutationCalls, tables };
}

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>;
const handlerOf = (fn: unknown) => (fn as { _handler: Handler })._handler;

type FeedEntry = { tierList: Record<string, unknown>; listModerationStatus?: string };
type Detail = { tierList: Record<string, unknown>; listModerationStatus?: string; canEdit: boolean } | null;

async function feedAs(viewer: Id<"users"> | null) {
  return (await handlerOf(listPublicFeed)(fakeCtx(viewer).ctx, { limit: 24 })) as FeedEntry[];
}

async function detailAs(viewer: Id<"users"> | null, tierListId: Id<"tierLists">) {
  return (await handlerOf(getDetail)(fakeCtx(viewer).ctx, { tierListId })) as Detail;
}

describe("moderation status helpers", () => {
  test("pending and rejected are hidden, approved and missing are not", () => {
    expect(isTierListHiddenByModeration("pending")).toBe(true);
    expect(isTierListHiddenByModeration("rejected")).toBe(true);
    expect(isTierListHiddenByModeration("approved")).toBe(false);
    expect(isTierListHiddenByModeration(undefined)).toBe(false);
  });

  test("the public tier list shape is the full shape minus listModerationStatus", () => {
    const publicFields = Object.keys(publicTierListValidator.fields).sort();
    const fullFields = Object.keys(tierListValidator.fields).filter((f) => f !== "listModerationStatus").sort();
    expect(publicFields).toEqual(fullFields);
    const doc = tierList(rejectedId, ownerId, 1, "rejected");
    expect(Object.keys(publicTierListFromDocument(doc as never))).not.toContain("listModerationStatus");
  });

  test("private lists stay owner-only, even for admins", () => {
    const privateList = { userId: ownerId, isPublic: false, listModerationStatus: "approved" as const };
    expect(canViewTierList({ userId: ownerId, isAdmin: false }, privateList)).toBe(true);
    expect(canViewTierList({ userId: adminId, isAdmin: true }, privateList)).toBe(false);
  });
});

describe("tierLists:listPublicFeed", () => {
  test("anonymous and member callers never get hidden lists or any status", async () => {
    for (const viewer of [null, memberId]) {
      const feed = await feedAs(viewer);
      const ids = feed.map((e) => e.tierList._id);
      expect(ids).toEqual([approvedId, legacyId]);
      for (const entry of feed) {
        expect(Object.keys(entry.tierList)).not.toContain("listModerationStatus");
      }
      // Anonymous gets no status at all. The member gets only the status of their own approved list.
      const statuses = feed.filter((e) => "listModerationStatus" in e).map((e) => e.tierList._id);
      expect(statuses).toEqual(viewer === null ? [] : [approvedId]);
    }
  });

  test("the owner sees their own hidden lists, with the status", async () => {
    const feed = await feedAs(ownerId);
    expect(feed.map((e) => e.tierList._id)).toEqual([approvedId, legacyId, rejectedId, pendingId]);
    const byId = new Map(feed.map((e) => [e.tierList._id, e]));
    expect(byId.get(rejectedId)?.listModerationStatus).toBe("rejected");
    expect(byId.get(pendingId)?.listModerationStatus).toBe("pending");
    // Not the owner of these, so no status.
    expect(byId.get(approvedId)?.listModerationStatus).toBeUndefined();
    for (const entry of feed) {
      expect(Object.keys(entry.tierList)).not.toContain("listModerationStatus");
    }
  });

  test("admins see every public list with its status; a banned admin counts as a member", async () => {
    const feed = await feedAs(adminId);
    expect(feed.map((e) => e.tierList._id)).toEqual([approvedId, legacyId, rejectedId, pendingId]);
    expect(feed.map((e) => e.listModerationStatus)).toEqual(["approved", undefined, "rejected", "pending"]);

    const banned = await feedAs(bannedAdminId);
    expect(banned.map((e) => e.tierList._id)).toEqual([approvedId, legacyId]);
    expect(banned.some((e) => "listModerationStatus" in e)).toBe(false);
  });
});

describe("tierLists:getDetail", () => {
  test("anonymous and member callers get null for hidden lists", async () => {
    for (const viewer of [null, memberId, bannedAdminId]) {
      for (const id of [...HIDDEN, privateRejectedId]) {
        expect(await detailAs(viewer, id)).toBeNull();
      }
      const visible = await detailAs(viewer, legacyId);
      expect(visible).not.toBeNull();
      expect(Object.keys(visible!.tierList)).not.toContain("listModerationStatus");
    }
    const anonymousApproved = await detailAs(null, approvedId);
    expect(anonymousApproved && "listModerationStatus" in anonymousApproved).toBe(false);
  });

  test("the owner gets their hidden lists with the status and can edit", async () => {
    for (const [id, status] of [
      [rejectedId, "rejected"],
      [pendingId, "pending"],
      [privateRejectedId, "rejected"],
    ] as const) {
      const detail = await detailAs(ownerId, id);
      expect(detail?.canEdit).toBe(true);
      expect(detail?.listModerationStatus).toBe(status);
      expect(Object.keys(detail!.tierList)).not.toContain("listModerationStatus");
    }
  });

  test("admins get hidden public lists with the status, read-only", async () => {
    for (const [id, status] of [
      [rejectedId, "rejected"],
      [pendingId, "pending"],
    ] as const) {
      const detail = await detailAs(adminId, id);
      expect(detail?.canEdit).toBe(false);
      expect(detail?.listModerationStatus).toBe(status);
    }
    expect(await detailAs(adminId, privateRejectedId)).toBeNull();
  });
});

describe("owner-only readers keep the status", () => {
  test("tierLists:listMine returns the owner's statuses", async () => {
    const mine = (await handlerOf(listMine)(fakeCtx(ownerId).ctx, { limit: 10 })) as Array<{
      _id: string;
      listModerationStatus?: string;
    }>;
    expect(mine.map((l) => [l._id, l.listModerationStatus])).toEqual([
      [rejectedId, "rejected"],
      [pendingId, "pending"],
      [privateRejectedId, "rejected"],
    ]);
    expect(await handlerOf(listMine)(fakeCtx(null).ctx, { limit: 10 })).toEqual([]);
  });
});

describe("likes and comments on hidden lists", () => {
  test("a member can't like or comment on a hidden list; the owner can like it", async () => {
    for (const id of HIDDEN) {
      await expect(handlerOf(toggleLike)(fakeCtx(memberId).ctx, { tierListId: id })).rejects.toThrow("Not authorized");
      await expect(handlerOf(addComment)(fakeCtx(memberId).ctx, { tierListId: id, content: "hi" })).rejects.toThrow(
        "Not authorized"
      );
      expect(await handlerOf(toggleLike)(fakeCtx(ownerId).ctx, { tierListId: id })).toEqual({
        liked: true,
        likeCount: 1,
      });
    }
  });

  test("the publish-time comment gate refuses hidden lists for members", async () => {
    const gate = handlerOf(assertPublicTierListCommentActor);
    for (const id of HIDDEN) {
      await expect(gate(fakeCtx(memberId).ctx, { tierListId: id })).rejects.toThrow("Not a public tier list");
      await expect(gate(fakeCtx(null).ctx, { tierListId: id })).rejects.toThrow("Not a public tier list");
      expect(await gate(fakeCtx(ownerId).ctx, { tierListId: id })).toBeNull();
      expect(await gate(fakeCtx(adminId).ctx, { tierListId: id })).toBeNull();
    }
    expect(await gate(fakeCtx(memberId).ctx, { tierListId: approvedId })).toBeNull();
  });
});

describe("community rankings", () => {
  test("pending and rejected lists don't count; approved and legacy lists do", async () => {
    const { ctx, inserted } = fakeCtx(null);
    await handlerOf(recomputeScope)(ctx, { game: "uvs", scopeType: "global", scopeKey: "global" });
    const snapshot = inserted.find((i) => i.table === "communityTierSnapshots")?.doc;
    expect(snapshot?.contributorCount).toBe(2);
    const votedCards = inserted.filter((i) => i.table === "communityCardRankings").map((i) => i.doc.cardId);
    expect(votedCards.sort()).toEqual(["card0", "card1"]);
  });

  test("a hidden list has no ranking scope", () => {
    const base = tierList(approvedId, memberId, 1) as never as Parameters<typeof getEligibleRankingScopeRefs>[0];
    expect(getEligibleRankingScopeRefs(base)).toEqual([{ game: "uvs", scopeType: "global", scopeKey: "global" }]);
    expect(getEligibleRankingScopeRefs({ ...base, listModerationStatus: "approved" })).toHaveLength(1);
    expect(getEligibleRankingScopeRefs({ ...base, listModerationStatus: "pending" })).toEqual([]);
    expect(getEligibleRankingScopeRefs({ ...base, listModerationStatus: "rejected" })).toEqual([]);
  });

  test("changing a list's moderation status recomputes its scope", async () => {
    for (const [id, next] of [
      [approvedId, "rejected"],
      [rejectedId, "approved"],
    ] as const) {
      const { ctx, runMutationCalls } = fakeCtx(adminId);
      await handlerOf(bulkSetTierListListModeration)(ctx, { tierListIds: [id], listModerationStatus: next });
      expect(runMutationCalls).toEqual([{ game: "uvs", scopeType: "global", scopeKey: "global" }]);
      expect((await ctx.db.get(id))?.listModerationStatus).toBe(next);
    }
    // Visibility doesn't change, so no ranking work: rejected -> pending (hidden both sides),
    // approved -> approved, and a legacy list with no status -> approved (visible both sides).
    for (const [id, next] of [
      [rejectedId, "pending"],
      [approvedId, "approved"],
      [legacyId, "approved"],
    ] as const) {
      const { ctx, runMutationCalls } = fakeCtx(adminId);
      await handlerOf(bulkSetTierListListModeration)(ctx, { tierListIds: [id], listModerationStatus: next });
      expect(runMutationCalls).toEqual([]);
      expect((await ctx.db.get(id))?.listModerationStatus).toBe(next);
    }
    // Members can't moderate.
    await expect(
      handlerOf(bulkSetTierListListModeration)(fakeCtx(memberId).ctx, {
        tierListIds: [approvedId],
        listModerationStatus: "rejected",
      })
    ).rejects.toThrow("Admin role required");
  });

  test("recompute calls match recomputeScope's args, even for a list stored without newer optional fields", async () => {
    // Required args of the internal mutation, read from its own validator, so this follows any
    // branch's signature (multi-game-platform adds a required `game`).
    const spec = JSON.parse((recomputeScope as unknown as { exportArgs: () => string }).exportArgs()) as {
      value: Record<string, { optional: boolean }>;
    };
    const required = Object.entries(spec.value)
      .filter(([, field]) => !field.optional)
      .map(([name]) => name)
      .sort();

    for (const [id, next] of [
      [approvedId, "rejected"],
      [rejectedId, "approved"],
    ] as const) {
      const { ctx, runMutationCalls, tables } = fakeCtx(adminId);
      // A row written before a column existed has no such key (on multi-game-platform: no `game`).
      const row = tables.tierLists.find((r) => r._id === id)!;
      delete row.game;
      await handlerOf(bulkSetTierListListModeration)(ctx, { tierListIds: [id], listModerationStatus: next });
      expect(runMutationCalls).toHaveLength(1);
      for (const call of runMutationCalls as Array<Record<string, unknown>>) {
        for (const key of Object.keys(call)) expect(Object.keys(spec.value)).toContain(key);
        for (const key of required) expect(call[key]).toBeDefined();
      }
    }
    expect(required.length).toBeGreaterThan(0);
  });
});
