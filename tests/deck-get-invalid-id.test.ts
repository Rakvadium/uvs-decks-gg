import { describe, expect, test } from "bun:test";
import type { Id } from "../convex/_generated/dataModel";
import { getById } from "../convex/decks";
import { getPendingInvitePreview } from "../convex/deckShares";

const ownerId = "j58owner" as Id<"users">;
const inviteeId = "j58invitee" as Id<"users">;
const publicDeckId = "k58publicdeck" as Id<"decks">;
const sharedDeckId = "k58shareddeck" as Id<"decks">;
const tierListId = "n58tierlist" as Id<"tierLists">;
const JUNK = "not-a-real-id";

type Row = Record<string, unknown> & { _id: string };

/**
 * In-memory ctx that resolves ids like Convex: `get` throws on a string that was never an id and
 * returns a document from any table, and `normalizeId` accepts only ids from the named table.
 */
function fakeCtx(signedInAs: Id<"users"> | null) {
  const tables: Record<string, Row[]> = {
    users: [
      { _id: ownerId, _creationTime: 1, username: "owner" },
      { _id: inviteeId, _creationTime: 1, username: "invitee" },
    ],
    decks: [
      { _id: publicDeckId, _creationTime: 1, userId: ownerId, game: "uvs", name: "Public deck", visibility: "public" },
      { _id: sharedDeckId, _creationTime: 1, userId: ownerId, game: "uvs", name: "Shared deck", visibility: "share" },
    ],
    tierLists: [{ _id: tierListId, _creationTime: 1, userId: ownerId, game: "uvs", title: "List", isPublic: true }],
    deckShares: [{ _id: "s58share", _creationTime: 1, deckId: sharedDeckId, userId: inviteeId, status: "pending" }],
  };
  const all = Object.values(tables).flat();
  return {
    auth: {
      getUserIdentity: async () =>
        signedInAs ? { subject: `${signedInAs}|session`, tokenIdentifier: "t", issuer: "i" } : null,
    },
    db: {
      get: async (id: string) => {
        const row = all.find((r) => r._id === id);
        if (!row) throw new Error(`Invalid ID: ${id}`);
        return { ...row };
      },
      normalizeId: (table: string, id: string) => ((tables[table] ?? []).some((r) => r._id === id) ? id : null),
      query: (table: string) => {
        const filters: Array<[string, unknown]> = [];
        const rows = () => (tables[table] ?? []).filter((row) => filters.every(([f, v]) => row[f] === v));
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
          first: async () => rows()[0] ?? null,
        };
        return c;
      },
    },
  };
}

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>;
const handlerOf = (fn: unknown) => (fn as { _handler: Handler })._handler;

const deckAs = (viewer: Id<"users"> | null, deckId: string) =>
  handlerOf(getById)(fakeCtx(viewer), { game: "uvs", deckId }) as Promise<{ _id: string } | null>;
const inviteAs = (viewer: Id<"users"> | null, deckId: string) =>
  handlerOf(getPendingInvitePreview)(fakeCtx(viewer), { deckId }) as Promise<{ deckName: string } | null>;

describe("decks:getById with a route param that is not a deck id", () => {
  test("a junk string returns null for guests and signed-in callers", async () => {
    expect(await deckAs(null, JUNK)).toBeNull();
    expect(await deckAs(ownerId, JUNK)).toBeNull();
  });

  test("a well-formed tier list id returns null, not the tier list", async () => {
    expect(await deckAs(null, tierListId)).toBeNull();
    expect(await deckAs(ownerId, tierListId)).toBeNull();
  });

  test("a real deck id still returns the deck", async () => {
    expect((await deckAs(null, publicDeckId))?._id).toBe(publicDeckId);
  });
});

describe("deckShares:getPendingInvitePreview with a route param that is not a deck id", () => {
  test("a junk string or a tier list id returns null for a signed-in caller", async () => {
    expect(await inviteAs(inviteeId, JUNK)).toBeNull();
    expect(await inviteAs(inviteeId, tierListId)).toBeNull();
  });

  test("a real pending invite still returns the deck name", async () => {
    expect(await inviteAs(inviteeId, sharedDeckId)).toEqual({ deckName: "Shared deck" });
  });
});
