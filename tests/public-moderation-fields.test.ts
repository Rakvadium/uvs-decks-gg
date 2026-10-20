import { describe, expect, test } from "bun:test";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";
import { getDetail } from "../convex/tierLists";
import { listPage } from "../convex/teams/chat";
import {
  getByCode,
  getById,
  getMostRecent,
  getSetCardCountAudit,
  list,
  listWithCardCountAudit,
} from "../convex/sets";
import {
  memberTeamChatMessageValidator,
  publicSetValidator,
  publicTierListCommentValidator,
} from "../convex/validators";

/** Moderation fields stored on comments and chat messages. None may reach a non-admin reader. */
const MODERATION_FIELDS = ["moderationReason", "textModerationProvider", "textModerationResult"];

const ownerId = "j57owner" as Id<"users">;
const memberId = "j57member" as Id<"users">;
const outsiderId = "j57outsider" as Id<"users">;
const adminId = "j57admin" as Id<"users">;
const tierListId = "k57tierlist" as Id<"tierLists">;
const teamId = "k57team" as Id<"teams">;
const setId = "k57set" as Id<"sets">;

function user(id: Id<"users">, role?: string) {
  return { _id: id, _creationTime: 1, username: id, profanityFilterEnabled: false, ...(role ? { role } : {}) };
}

const tierList = {
  _id: tierListId,
  _creationTime: 1,
  userId: ownerId,
  title: "List",
  isPublic: true,
  selectedSetCodes: [],
  previewCardIds: [],
  tiers: [],
  itemCount: 0,
  likeCount: 0,
  commentCount: 1,
  createdAt: 1,
  updatedAt: 1,
};

const comment = {
  _id: "k57comment",
  _creationTime: 1,
  tierListId,
  userId: memberId,
  content: "hi",
  status: "approved",
  moderationReason: "<placeholder>",
  textModerationProvider: "<placeholder>",
  textModerationResult: { flagged: false, categories: { harassment: false } },
  createdAt: 1,
  updatedAt: 1,
};

const team = {
  _id: teamId,
  _creationTime: 1,
  name: "Team",
  captainUserId: ownerId,
  createdAt: 1,
  updatedAt: 1,
};

const membership = {
  _id: "k57membership",
  _creationTime: 1,
  teamId,
  userId: memberId,
  role: "pilot",
  joinedAt: 1,
  status: "active",
};

const chatMessage = {
  _id: "k57message",
  _creationTime: 1,
  teamId,
  authorUserId: ownerId,
  body: "hello",
  createdAt: 1,
  textModerationProvider: "<placeholder>",
  textModerationResult: { flagged: false, categories: { harassment: false } },
};

const set = {
  _id: setId,
  _creationTime: 1,
  code: "s1",
  name: "Set One",
  setNumber: 1,
  cardCount: 0,
  updatedAt: 2,
  updatedBy: adminId,
};

/** Minimal ctx: `db.get` by id, and every `db.query` chain resolves to the table's rows. */
function fakeCtx(signedInAs: Id<"users"> | null) {
  const docs = new Map<string, unknown>([
    [ownerId, user(ownerId)],
    [memberId, user(memberId)],
    [outsiderId, user(outsiderId)],
    [adminId, user(adminId, "Admin")],
    [tierListId, tierList],
    [teamId, team],
    [setId, set],
  ]);
  const tables: Record<string, unknown[]> = {
    tierListComments: [comment],
    teamMembers: [membership],
    teamChatMessages: [chatMessage],
    sets: [set],
  };
  const chain = (table: string) => {
    const rows = tables[table] ?? [];
    let matchUserId: unknown;
    const c = {
      withIndex: (_name: string, build?: (q: unknown) => unknown) => {
        const q = {
          eq: (field: string, value: unknown) => {
            if (field === "userId") matchUserId = value;
            return q;
          },
        };
        build?.(q);
        return c;
      },
      order: () => c,
      filter: () => c,
      take: async () => rows,
      collect: async () => rows,
      unique: async () =>
        rows.find((row) => matchUserId === undefined || (row as { userId?: unknown }).userId === matchUserId) ??
        null,
      paginate: async () => ({ page: rows, isDone: true, continueCursor: "end" }),
    };
    return c;
  };
  return {
    auth: {
      getUserIdentity: async () =>
        signedInAs ? { subject: `${signedInAs}|session`, tokenIdentifier: "t", issuer: "i" } : null,
    },
    db: {
      get: async (id: string) => docs.get(id) ?? null,
      query: chain,
    },
  };
}

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>;
const handlerOf = (fn: unknown) => (fn as { _handler: Handler })._handler;
const returnsOf = (fn: unknown) => (fn as { exportReturns: () => string }).exportReturns();

function expectNoFields(value: unknown, fields: string[]) {
  expect(value).not.toBeNull();
  for (const field of fields) {
    expect(Object.keys(value as object)).not.toContain(field);
  }
}

function expectReturnsLackFields(fn: unknown, fields: string[]) {
  const json = returnsOf(fn);
  for (const field of fields) {
    expect(json).not.toContain(`"${field}":`);
  }
}

describe("public shapes", () => {
  test("validators leave out moderation fields and updatedBy", () => {
    for (const field of MODERATION_FIELDS) {
      expect(Object.keys(publicTierListCommentValidator.fields)).not.toContain(field);
      expect(Object.keys(memberTeamChatMessageValidator.fields)).not.toContain(field);
    }
    expect(Object.keys(publicSetValidator.fields)).not.toContain("updatedBy");
  });

  test("public set shape covers every other sets field", () => {
    // publicSetFromDocument drops only updatedBy, so a sets field missing here would fail at runtime.
    const tableFields = Object.keys(schema.tables.sets.validator.fields).filter((f) => f !== "updatedBy");
    const publicFields = Object.keys(publicSetValidator.fields).filter((f) => !f.startsWith("_"));
    expect(publicFields.sort()).toEqual(tableFields.sort());
  });
});

describe("tierLists:getDetail comments", () => {
  test("anonymous and signed-in calls get comments without moderation fields", async () => {
    for (const viewer of [null, memberId, ownerId]) {
      const detail = (await handlerOf(getDetail)(fakeCtx(viewer), { tierListId })) as {
        comments: Array<{ comment: Record<string, unknown> }>;
      };
      expect(detail.comments).toHaveLength(1);
      const shown = detail.comments[0].comment;
      expect(shown.content).toBe("hi");
      expect(shown.status).toBe("approved");
      expectNoFields(shown, MODERATION_FIELDS);
    }
    expectReturnsLackFields(getDetail, MODERATION_FIELDS);
  });
});

describe("teams/chat:listPage", () => {
  const args = { teamId, paginationOpts: { numItems: 20, cursor: null } };

  test("team members get messages without moderation fields", async () => {
    for (const viewer of [memberId, ownerId]) {
      const result = (await handlerOf(listPage)(fakeCtx(viewer), args)) as {
        page: Array<{ message: Record<string, unknown>; authorUsername?: string }>;
      };
      expect(result.page).toHaveLength(1);
      expect(result.page[0].message.body).toBe("hello");
      expect(result.page[0].authorUsername).toBe(ownerId);
      expectNoFields(result.page[0].message, MODERATION_FIELDS);
    }
    expectReturnsLackFields(listPage, MODERATION_FIELDS);
  });

  test("anonymous and non-member calls get an empty page", async () => {
    for (const viewer of [null, outsiderId]) {
      const result = (await handlerOf(listPage)(fakeCtx(viewer), args)) as { page: unknown[] };
      expect(result.page).toEqual([]);
    }
  });
});

describe("sets public reads", () => {
  test("list, getByCode, getById and getMostRecent leave out updatedBy", async () => {
    for (const viewer of [null, memberId]) {
      const ctx = fakeCtx(viewer);
      const listed = (await handlerOf(list)(ctx, {})) as unknown[];
      expect(listed).toHaveLength(1);
      const results = [
        listed[0],
        await handlerOf(getByCode)(ctx, { code: "s1" }),
        await handlerOf(getById)(ctx, { setId }),
        await handlerOf(getMostRecent)(ctx, {}),
      ];
      for (const result of results) {
        expect((result as { code: string }).code).toBe("s1");
        expectNoFields(result, ["updatedBy"]);
      }
    }
    for (const fn of [list, getByCode, getById, getMostRecent]) {
      expectReturnsLackFields(fn, ["updatedBy"]);
    }
  });

  test("admin-gated set reads keep updatedBy", async () => {
    const audit = (await handlerOf(getSetCardCountAudit)(fakeCtx(adminId), { code: "s1" })) as {
      set: { updatedBy?: string };
    };
    expect(audit.set.updatedBy).toBe(adminId);
    for (const fn of [listWithCardCountAudit, getSetCardCountAudit]) {
      expect(returnsOf(fn)).toContain('"updatedBy":');
    }
  });

  test("admin-gated set reads refuse anonymous and non-admin calls", async () => {
    for (const viewer of [null, memberId]) {
      await expect(handlerOf(listWithCardCountAudit)(fakeCtx(viewer), {})).rejects.toThrow();
    }
  });
});
