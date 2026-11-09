import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { currentUser, getById } from "../convex/user";
import { getDetail, listPublicFeed } from "../convex/tierLists";
import {
  publicUserProfileFromDocument,
  publicUserProfileValidator,
} from "../convex/validators";

const PUBLIC_FIELDS = ["_creationTime", "_id", "image", "username"];

/** Every `users` field that isn't public, so a test fails if any of them leaks. */
const PRIVATE_FIELDS = [
  "email",
  "emailVerificationTime",
  "isAnonymous",
  "role",
  "profanityFilterEnabled",
  "accountStatus",
  "statusReason",
  "statusSetAt",
  "statusSetBy",
  "statusExpiresAt",
  "userFacingMessage",
  "adminSearchText",
  "hasVerifiedEmail",
] as const;

const authorId = "j57author" as Id<"users">;
const commenterId = "j57commenter" as Id<"users">;
const tierListId = "k57tierlist" as Id<"tierLists">;

function fullUser(id: Id<"users">, username: string): Doc<"users"> {
  return {
    _id: id,
    _creationTime: 1,
    username,
    image: "https://example.invalid/avatar.png",
    email: "<placeholder-email>",
    emailVerificationTime: 2,
    isAnonymous: false,
    role: "Admin",
    profanityFilterEnabled: false,
    accountStatus: "write_restricted",
    statusReason: "<placeholder>",
    statusSetAt: 3,
    statusSetBy: id,
    statusExpiresAt: 4,
    userFacingMessage: "<placeholder>",
    adminSearchText: "<placeholder>",
    hasVerifiedEmail: true,
  };
}

const tierList = {
  _id: tierListId,
  _creationTime: 1,
  userId: authorId,
  title: "List",
  isPublic: true,
  selectedSetCodes: [],
  previewCardIds: [],
  tiers: [],
  itemCount: 0,
  likeCount: 0,
  commentCount: 0,
  createdAt: 1,
  updatedAt: 1,
};

const comment = {
  _id: "k57comment",
  _creationTime: 1,
  tierListId,
  userId: commenterId,
  content: "hi",
  status: "approved",
  createdAt: 1,
  updatedAt: 1,
};

/** Minimal ctx: `db.get` by id, and every `db.query` chain resolves to the table's rows. */
function fakeCtx(signedInAs: Id<"users"> | null) {
  const docs = new Map<string, unknown>([
    [authorId, fullUser(authorId, "author")],
    [commenterId, fullUser(commenterId, "commenter")],
    [tierListId, tierList],
  ]);
  const tables: Record<string, unknown[]> = {
    tierLists: [tierList],
    tierListComments: [comment],
    tierListItems: [],
    tierListLikes: [],
  };
  const chain = (rows: unknown[]) => {
    const c = {
      withIndex: () => c,
      order: () => c,
      filter: () => c,
      take: async () => rows,
      collect: async () => rows,
      unique: async () => null,
      async *[Symbol.asyncIterator]() {
        yield* rows;
      },
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
      query: (table: string) => chain(tables[table] ?? []),
    },
  };
}

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>;
const handlerOf = (fn: unknown) => (fn as { _handler: Handler })._handler;
const returnsOf = (fn: unknown) => (fn as { exportReturns: () => string }).exportReturns();

function expectPublicProfile(value: unknown) {
  expect(value).not.toBeNull();
  expect(Object.keys(value as object).sort()).toEqual(PUBLIC_FIELDS);
}

function expectReturnsCarryNoPrivateFields(fn: unknown) {
  const json = returnsOf(fn);
  for (const field of PRIVATE_FIELDS) {
    expect(json).not.toContain(`"${field}":`);
  }
}

describe("public user profile shape", () => {
  test("validator allows only public fields", () => {
    expect(Object.keys(publicUserProfileValidator.fields).sort()).toEqual(PUBLIC_FIELDS);
  });

  test("document mapper copies only public fields", () => {
    const profile = publicUserProfileFromDocument(fullUser(authorId, "author"));
    expect(profile).toEqual({
      _id: authorId,
      _creationTime: 1,
      username: "author",
      image: "https://example.invalid/avatar.png",
    });
  });
});

describe("user:getById", () => {
  test("anonymous and other-user calls return only public fields", async () => {
    for (const viewer of [null, commenterId]) {
      const result = await handlerOf(getById)(fakeCtx(viewer), { userId: authorId });
      expectPublicProfile(result);
    }
  });

  test("returns validator carries no private fields", () => {
    expectReturnsCarryNoPrivateFields(getById);
  });
});

describe("tierLists public reads", () => {
  test("listPublicFeed authors are public profiles", async () => {
    const feed = (await handlerOf(listPublicFeed)(fakeCtx(null), {})) as Array<{ author: unknown }>;
    expect(feed).toHaveLength(1);
    expectPublicProfile(feed[0].author);
    expectReturnsCarryNoPrivateFields(listPublicFeed);
  });

  test("getDetail author and comment authors are public profiles", async () => {
    const detail = (await handlerOf(getDetail)(fakeCtx(null), { tierListId })) as {
      author: unknown;
      comments: Array<{ author: unknown }>;
    };
    expectPublicProfile(detail.author);
    expect(detail.comments).toHaveLength(1);
    expectPublicProfile(detail.comments[0].author);
    expectReturnsCarryNoPrivateFields(getDetail);
  });
});

describe("user:currentUser (self)", () => {
  test("still returns the signed-in user's own email and verification fields", async () => {
    const self = (await handlerOf(currentUser)(fakeCtx(authorId), {})) as Record<string, unknown>;
    expect(self._id).toBe(authorId);
    expect(self.email).toBe("<placeholder-email>");
    expect(self.emailVerificationTime).toBe(2);
    expect(self.hasVerifiedEmail).toBe(true);
    expect(returnsOf(currentUser)).toContain('"email":');
  });

  test("returns null when signed out", async () => {
    expect(await handlerOf(currentUser)(fakeCtx(null), {})).toBeNull();
  });
});
