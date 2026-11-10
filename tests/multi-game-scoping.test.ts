import { describe, expect, test } from "bun:test";
import schema from "../convex/schema";
import { GAME_SCOPED_TABLES, gameBackfillPatch } from "../convex/lib/gameBackfill";
import { docGame, gameValuesWithLegacy, isDocInGame } from "../convex/lib/gameScope";
import {
  catalogObjectKeyForVersion,
  catalogObjectKeysToDelete,
  legacyCatalogObjectKeyForVersion,
  PUBLIC_R2_BASE_URL,
  toPublicCatalogUrl,
} from "../convex/publicCardUrls";
import { nextSessionGameState, resolveSessionGameState } from "../convex/lib/sessionGameState";
import { buildDuplicatedDeckFields } from "../convex/lib/duplicateDeck";
import { assertAllowedR2ObjectKey } from "../convex/lib/r2Keys";
import type { Doc, Id } from "../convex/_generated/dataModel";

describe("gameBackfillPatch", () => {
  test("tags untagged docs with the default game", () => {
    expect(gameBackfillPatch({})).toEqual({ game: "uvs" });
    expect(gameBackfillPatch({ game: undefined })).toEqual({ game: "uvs" });
  });

  test("leaves tagged docs alone (idempotent)", () => {
    expect(gameBackfillPatch({ game: "uvs" })).toBeNull();
    expect(gameBackfillPatch(gameBackfillPatch({})!)).toBeNull();
  });

  test("every backfilled table declares an optional `game` field in the schema", () => {
    for (const table of GAME_SCOPED_TABLES) {
      const validator = schema.tables[table].validator as unknown as { json: unknown };
      const json = JSON.stringify(validator.json);
      expect(json).toContain('"game"');
    }
  });
});

describe("game scope helpers", () => {
  test("docs without game belong to the default game", () => {
    expect(docGame({})).toBe("uvs");
    expect(docGame({ game: "uvs" })).toBe("uvs");
    expect(isDocInGame({}, "uvs")).toBe(true);
    expect(isDocInGame(null, "uvs")).toBe(false);
    expect(isDocInGame(undefined, "uvs")).toBe(false);
  });

  test("singleton lookups fall back to the untagged legacy row for the default game only", () => {
    expect(gameValuesWithLegacy("uvs")).toEqual(["uvs", undefined]);
  });
});

describe("catalog object keys", () => {
  test("per-game key and public URL", () => {
    expect(catalogObjectKeyForVersion("uvs", 7)).toBe("catalog/uvs/v7.json.gz");
    expect(toPublicCatalogUrl("uvs", 7)).toBe(`${PUBLIC_R2_BASE_URL}/catalog/uvs/v7.json.gz`);
    expect(legacyCatalogObjectKeyForVersion(7)).toBe("catalog/v7.json.gz");
  });

  test("cleanup deletes the game's key plus the legacy key for the default game", () => {
    expect(catalogObjectKeysToDelete("uvs", 3)).toEqual([
      "catalog/uvs/v3.json.gz",
      "catalog/v3.json.gz",
    ]);
    // A non-default game never touches the legacy keys.
    expect(catalogObjectKeysToDelete("other", 3)).toEqual(["catalog/other/v3.json.gz"]);
    expect(catalogObjectKeysToDelete("uvs", 0)).toEqual([]);
  });

  test("per-game keys stay inside the allowed R2 prefixes", () => {
    expect(() => assertAllowedR2ObjectKey(catalogObjectKeyForVersion("uvs", 1))).not.toThrow();
  });
});

describe("session game state", () => {
  const deckA = "deckA" as Id<"decks">;
  const deckB = "deckB" as Id<"decks">;

  test("default game falls back to legacy top-level fields until gameState exists", () => {
    const legacy = { activeDeckId: deckA, rightSidebarAction: "stats", galleryFilters: { set: ["X"] } };
    expect(resolveSessionGameState(legacy, "uvs")).toEqual(legacy);
    expect(resolveSessionGameState(legacy, "other")).toEqual({});
    expect(resolveSessionGameState(null, "uvs")).toEqual({});
  });

  test("gameState[game] is authoritative once written (no legacy resurrection)", () => {
    const session = { activeDeckId: deckA, gameState: { uvs: { rightSidebarAction: "list" } } };
    expect(resolveSessionGameState(session, "uvs")).toEqual({ rightSidebarAction: "list" });
  });

  test("first write seeds from legacy fields; null clears; undefined keeps", () => {
    const session = { activeDeckId: deckA, rightSidebarAction: "stats" };
    const next = nextSessionGameState(session, "uvs", { activeDeckId: deckB, rightSidebarAction: undefined });
    expect(next).toEqual({ uvs: { activeDeckId: deckB, rightSidebarAction: "stats" } });

    const cleared = nextSessionGameState({ ...session, gameState: next }, "uvs", { activeDeckId: null });
    expect(cleared).toEqual({ uvs: { rightSidebarAction: "stats" } });
    expect(resolveSessionGameState({ ...session, gameState: cleared }, "uvs").activeDeckId).toBeUndefined();
  });

  test("writes for one game leave other games untouched", () => {
    const session = { gameState: { other: { activeDeckId: deckA } } };
    expect(nextSessionGameState(session, "uvs", { activeDeckId: deckB })).toEqual({
      other: { activeDeckId: deckA },
      uvs: { activeDeckId: deckB },
    });
  });
});

describe("buildDuplicatedDeckFields game", () => {
  const base = {
    _id: "d1" as Id<"decks">,
    _creationTime: 1,
    userId: "u1" as Id<"users">,
    name: "Deck",
    isPublic: false,
    mainCardIds: [],
    mainQuantities: {},
    sideCardIds: [],
    sideQuantities: {},
    referenceCardIds: [],
    referenceQuantities: {},
  };

  test("copies the source deck's game (legacy decks become the default game)", () => {
    expect(buildDuplicatedDeckFields({ ...base, game: "uvs" } as Doc<"decks">).game).toBe("uvs");
    expect(buildDuplicatedDeckFields(base as Doc<"decks">).game).toBe("uvs");
  });
});
