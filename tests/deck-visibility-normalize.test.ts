import { describe, expect, test } from "bun:test";
import {
  canViewPrivateOrUnlistedDeck,
} from "../convex/lib/deckAccess";
import {
  deckVisibilityLabel,
  normalizeDeckVisibility,
} from "../src/lib/deck/visibility";
import type { Doc, Id } from "../convex/_generated/dataModel";

const owner = "j57abc" as Id<"users">;
const other = "j57def" as Id<"users">;

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
  test("preserves unlisted", () => {
    expect(normalizeDeckVisibility(baseDeck({ visibility: "unlisted" }))).toBe("unlisted");
  });

  test("preserves other visibility values", () => {
    expect(normalizeDeckVisibility(baseDeck({ visibility: "private" }))).toBe("private");
    expect(normalizeDeckVisibility(baseDeck({ visibility: "share" }))).toBe("share");
    expect(normalizeDeckVisibility(baseDeck({ visibility: "public" }))).toBe("public");
  });

  test("falls back from isPublic when visibility missing", () => {
    expect(normalizeDeckVisibility(baseDeck({ isPublic: true }))).toBe("public");
    expect(normalizeDeckVisibility(baseDeck({ isPublic: false }))).toBe("private");
  });
});

describe("deckVisibilityLabel", () => {
  test("labels private and unlisted distinctly", () => {
    expect(deckVisibilityLabel("private")).toBe("Private");
    expect(deckVisibilityLabel("unlisted")).toBe("Unlisted");
  });
});

describe("canViewPrivateOrUnlistedDeck", () => {
  test("private is owner-only", () => {
    expect(canViewPrivateOrUnlistedDeck("private", owner, owner)).toBe(true);
    expect(canViewPrivateOrUnlistedDeck("private", owner, other)).toBe(false);
    expect(canViewPrivateOrUnlistedDeck("private", owner, null)).toBe(false);
  });

  test("unlisted is link-readable by anyone", () => {
    expect(canViewPrivateOrUnlistedDeck("unlisted", owner, null)).toBe(true);
    expect(canViewPrivateOrUnlistedDeck("unlisted", owner, other)).toBe(true);
    expect(canViewPrivateOrUnlistedDeck("unlisted", owner, owner)).toBe(true);
  });

  test("returns null for modes that need further checks", () => {
    expect(canViewPrivateOrUnlistedDeck("share", owner, other)).toBe(null);
    expect(canViewPrivateOrUnlistedDeck("public", owner, null)).toBe(null);
    expect(canViewPrivateOrUnlistedDeck("team", owner, other)).toBe(null);
  });
});
