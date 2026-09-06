import { describe, expect, test } from "bun:test";
import { buildDuplicatedDeckFields, duplicateDeckName } from "../convex/lib/duplicateDeck";
import type { Doc, Id } from "../convex/_generated/dataModel";

describe("duplicateDeckName", () => {
  test("appends (copy) to a named deck", () => {
    expect(duplicateDeckName("Beau")).toBe("Beau (copy)");
  });

  test("trims whitespace before suffixing", () => {
    expect(duplicateDeckName("  Beau  ")).toBe("Beau (copy)");
  });

  test("falls back when the name is blank", () => {
    expect(duplicateDeckName("   ")).toBe("Deck (copy)");
  });
});

describe("buildDuplicatedDeckFields", () => {
  test("copies list contents and resets ownership fields", () => {
    const source = {
      _id: "kh7src" as Id<"decks">,
      _creationTime: 1,
      userId: "ms7owner" as Id<"users">,
      name: "Public Sage",
      description: "listed",
      visibility: "public",
      isPublic: true,
      format: "standard",
      subFormat: "constructed",
      startingCharacterId: "k17char" as Id<"cards">,
      selectedIdentity: "water",
      imageCardId: "k17art" as Id<"cards">,
      mainCardIds: ["k17a" as Id<"cards">],
      mainQuantities: { k17a: 4 },
      sideCardIds: ["k17b" as Id<"cards">],
      sideQuantities: { k17b: 2 },
      referenceCardIds: ["k17c" as Id<"cards">],
      referenceQuantities: { k17c: 1 },
      cardLayouts: {
        main: {
          columns: [{ id: "col-1", name: "Attacks", color: "red", cardIds: ["k17a"] }],
          unassignedCardIds: ["k17z"],
        },
      },
      teamId: "j97team" as Id<"teams">,
      teamCollaboration: "team_editable",
      revision: 12,
    } as Doc<"decks">;

    const copy = buildDuplicatedDeckFields(source);

    expect(copy.name).toBe("Public Sage (copy)");
    expect(copy.description).toBe("listed");
    expect(copy.visibility).toBe("private");
    expect(copy.isPublic).toBe(false);
    expect(copy.teamCollaboration).toBe("none");
    expect(copy.format).toBe("standard");
    expect(copy.subFormat).toBe("constructed");
    expect(copy.startingCharacterId).toBe(source.startingCharacterId);
    expect(copy.selectedIdentity).toBe("water");
    expect(copy.imageCardId).toBe(source.imageCardId);
    expect(copy.mainCardIds).toEqual(source.mainCardIds);
    expect(copy.mainCardIds).not.toBe(source.mainCardIds);
    expect(copy.mainQuantities).toEqual(source.mainQuantities);
    expect(copy.mainQuantities).not.toBe(source.mainQuantities);
    expect(copy.sideCardIds).toEqual(source.sideCardIds);
    expect(copy.sideQuantities).toEqual(source.sideQuantities);
    expect(copy.referenceCardIds).toEqual(source.referenceCardIds);
    expect(copy.referenceQuantities).toEqual(source.referenceQuantities);
    expect(copy.cardLayouts?.main.columns[0]?.cardIds).toEqual(["k17a"]);
    expect(copy.cardLayouts?.main.columns[0]?.cardIds).not.toBe(
      source.cardLayouts?.main.columns[0]?.cardIds,
    );
    expect(copy.revision).toBe(0);
    expect(copy).not.toHaveProperty("teamId");
    expect(copy).not.toHaveProperty("userId");
  });
});
