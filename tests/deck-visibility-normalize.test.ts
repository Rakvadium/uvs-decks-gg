import { describe, expect, test } from "bun:test";
import { normalizeDeckVisibility } from "../src/lib/deck/visibility";
import type { Doc, Id } from "../convex/_generated/dataModel";

const owner = "j57abc" as Id<"users">;

function baseDeck(overrides: Partial<Doc<"decks">> = {}): Doc<"decks"> {
  return {
    _id: "k57abc" as Id<"decks">,
    _creationTime: 0,
    userId: owner,
    name: "x",
    isPublic: false,
    mainCardIds: [],
    mainQuantities: {},
    sideCardIds: [],
    sideQuantities: {},
    referenceCardIds: [],
    referenceQuantities: {},
    ...overrides,
  } as Doc<"decks">;
}

describe("normalizeDeckVisibility", () => {
  test("maps legacy unlisted to private", () => {
    expect(normalizeDeckVisibility(baseDeck({ visibility: "unlisted" }))).toBe("private");
  });

  test("preserves other visibility values", () => {
    expect(normalizeDeckVisibility(baseDeck({ visibility: "share" }))).toBe("share");
    expect(normalizeDeckVisibility(baseDeck({ visibility: "public" }))).toBe("public");
  });
});
