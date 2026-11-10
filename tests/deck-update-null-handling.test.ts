import { describe, expect, test } from "bun:test";
import { update } from "../convex/decks";
import type { Doc, Id } from "../convex/_generated/dataModel";

// Exercises the real mutation handler with a minimal fake ctx (no Convex runtime).

type Handler = (ctx: unknown, args: Record<string, unknown>) => Promise<null>;
const handler = (update as unknown as { _handler: Handler })._handler;

const ownerId = "user1" as Id<"users">;

function makeCtx(docs: Record<string, unknown>, subject: string | null = `${ownerId}|session1`) {
  const patches: { id: string; value: Record<string, unknown> }[] = [];
  const ctx = {
    auth: {
      getUserIdentity: async () => (subject ? { subject, tokenIdentifier: subject, issuer: "test" } : null),
    },
    db: {
      get: async (id: string) => docs[id] ?? null,
      patch: async (id: string, value: Record<string, unknown>) => {
        patches.push({ id, value });
      },
      query: () => {
        throw new Error("unexpected query");
      },
    },
  };
  return { ctx, patches };
}

const deck = {
  _id: "deck1" as Id<"decks">,
  _creationTime: 0,
  userId: ownerId,
  name: "Deck",
  isPublic: false,
  visibility: "private",
  startingCharacterId: "char1" as Id<"cards">,
  selectedIdentity: "fire",
  imageCardId: "char1" as Id<"cards">,
  format: "standard",
  subFormat: "constructed",
  description: "d",
  mainCardIds: [],
  mainQuantities: {},
  sideCardIds: [],
  sideQuantities: {},
  referenceCardIds: [],
  referenceQuantities: {},
} as unknown as Doc<"decks">;

const user = { _id: ownerId, _creationTime: 0 };
const front = { _id: "char2", _creationTime: 0, name: "Front", isFrontFace: true };
const back = { _id: "back1", _creationTime: 0, name: "Back", isFrontFace: false };

function docs() {
  return { deck1: deck, user1: user, char2: front, back1: back } as Record<string, unknown>;
}

describe("decks.update null handling", () => {
  // Setup writes go to `setup`; the deprecated top-level fields are mirrored from it (the live
  // frontend still reads them) and patched as undefined when the setup lacks a value.
  const legacy = (startingCharacterId: string | undefined, selectedIdentity: string | undefined) => ({
    startingCharacterId,
    selectedIdentity,
  });

  test("null startingCharacterId / selectedIdentity clear the fields (patched as undefined)", async () => {
    const { ctx, patches } = makeCtx(docs());
    await handler(ctx, { deckId: "deck1", startingCharacterId: null, selectedIdentity: null });
    expect(patches).toHaveLength(1);
    expect(patches[0]?.id).toBe("deck1");
    expect(Object.keys(patches[0]!.value).sort()).toEqual(["selectedIdentity", "setup", "startingCharacterId"]);
    expect(patches[0]!.value.startingCharacterId).toBeUndefined();
    expect(patches[0]!.value.selectedIdentity).toBeUndefined();
    expect(patches[0]!.value.setup).toEqual({ game: "uvs" });
  });

  test("null fields in a setup patch clear them; setup: null clears the whole setup", async () => {
    const a = makeCtx(docs());
    await handler(a.ctx, { deckId: "deck1", setup: { game: "uvs", startingCharacterId: null } });
    expect(a.patches[0]!.value).toEqual({ setup: { game: "uvs", selectedIdentity: "fire" }, ...legacy(undefined, "fire") });

    const b = makeCtx(docs());
    await handler(b.ctx, { deckId: "deck1", setup: null });
    expect(b.patches[0]!.value).toEqual({ setup: { game: "uvs" }, ...legacy(undefined, undefined) });
  });

  test("setting one setup field keeps the other (read from setup, else legacy fields)", async () => {
    const fromLegacy = makeCtx(docs());
    await handler(fromLegacy.ctx, { deckId: "deck1", setup: { game: "uvs", startingCharacterId: "char2" } });
    expect(fromLegacy.patches[0]!.value).toEqual({
      setup: { game: "uvs", startingCharacterId: "char2", selectedIdentity: "fire" },
      ...legacy("char2", "fire"),
    });

    const migrated = makeCtx({
      ...docs(),
      deck1: { ...deck, startingCharacterId: undefined, selectedIdentity: undefined, setup: { game: "uvs", selectedIdentity: "water" } },
    });
    await handler(migrated.ctx, { deckId: "deck1", selectedIdentity: "air" });
    expect(migrated.patches[0]!.value).toEqual({ setup: { game: "uvs", selectedIdentity: "air" }, ...legacy(undefined, "air") });
  });

  test("explicit setup fields win over legacy args", async () => {
    const { ctx, patches } = makeCtx(docs());
    await handler(ctx, {
      deckId: "deck1",
      setup: { game: "uvs", selectedIdentity: "water" },
      selectedIdentity: "air",
      startingCharacterId: null,
    });
    expect(patches[0]!.value).toEqual({ setup: { game: "uvs", selectedIdentity: "water" }, ...legacy(undefined, "water") });
  });

  test("null imageCardId / format / subFormat / description also clear", async () => {
    const { ctx, patches } = makeCtx(docs());
    await handler(ctx, { deckId: "deck1", imageCardId: null, format: null, subFormat: null, description: null });
    expect(Object.keys(patches[0]!.value).sort()).toEqual(["description", "format", "imageCardId", "subFormat"]);
    for (const value of Object.values(patches[0]!.value)) expect(value).toBeUndefined();
  });

  test("omitted fields are not patched; no-op update writes nothing", async () => {
    const { ctx, patches } = makeCtx(docs());
    await handler(ctx, { deckId: "deck1" });
    expect(patches).toEqual([]);
  });

  test("values are passed through, including empty-string identity", async () => {
    const { ctx, patches } = makeCtx(docs());
    await handler(ctx, { deckId: "deck1", startingCharacterId: "char2", selectedIdentity: "" });
    expect(patches[0]!.value).toEqual({
      setup: { game: "uvs", startingCharacterId: "char2", selectedIdentity: "" },
      ...legacy("char2", ""),
    });
  });

  test("setting a back-face or missing starting character throws", async () => {
    const a = makeCtx(docs());
    await expect(handler(a.ctx, { deckId: "deck1", startingCharacterId: "back1" })).rejects.toThrow(
      "Cannot add back-face card directly",
    );
    const b = makeCtx(docs());
    await expect(handler(b.ctx, { deckId: "deck1", startingCharacterId: "nope" })).rejects.toThrow("Card not found");
    expect(a.patches).toEqual([]);
    const c = makeCtx(docs());
    await expect(
      handler(c.ctx, { deckId: "deck1", setup: { game: "uvs", startingCharacterId: "back1" } }),
    ).rejects.toThrow("Cannot add back-face card directly");
    expect(c.patches).toEqual([]);
  });

  test("auth and ownership are enforced before patching", async () => {
    const anon = makeCtx(docs(), null);
    await expect(handler(anon.ctx, { deckId: "deck1", selectedIdentity: null })).rejects.toThrow("Not authenticated");
    const other = makeCtx({ ...docs(), user2: { _id: "user2", _creationTime: 0 } }, "user2|s");
    await expect(handler(other.ctx, { deckId: "deck1", selectedIdentity: null })).rejects.toThrow("Not authorized");
    const missing = makeCtx(docs());
    await expect(handler(missing.ctx, { deckId: "nope" })).rejects.toThrow("Deck not found");
  });
});
