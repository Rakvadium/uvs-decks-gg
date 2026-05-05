import { describe, expect, test } from "bun:test";
import {
  assertTeamEditableCardWriteRevision,
  canUserWriteDeck,
  getDeckRevision,
  isTeamEditableDeck,
} from "../convex/lib/deckAccess";
import type { Doc, Id } from "../convex/_generated/dataModel";

const owner = "j57abc" as Id<"users">;
const other = "j57def" as Id<"users">;
const teamId = "j97abc" as Id<"teams">;

function baseDeck(
  overrides: Partial<Doc<"decks">> & Pick<Doc<"decks">, "visibility">,
): Doc<"decks"> {
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

describe("canUserWriteDeck", () => {
  test("non-team deck is owner-only", () => {
    const d = baseDeck({ visibility: "private" });
    expect(canUserWriteDeck(owner, d, null)).toBe(true);
    expect(canUserWriteDeck(other, d, "pilot")).toBe(false);
  });

  test("team_viewable is owner-only", () => {
    const d = baseDeck({
      visibility: "team",
      teamId,
      teamCollaboration: "team_viewable",
    });
    expect(canUserWriteDeck(owner, d, "pilot")).toBe(true);
    expect(canUserWriteDeck(other, d, "pilot")).toBe(false);
    expect(canUserWriteDeck(other, d, "captain")).toBe(false);
  });

  test("team_editable allows collaborate with create_team_deck", () => {
    const d = baseDeck({
      visibility: "team",
      teamId,
      teamCollaboration: "team_editable",
    });
    expect(canUserWriteDeck(owner, d, null)).toBe(true);
    expect(canUserWriteDeck(other, d, "pilot")).toBe(true);
    expect(canUserWriteDeck(other, d, null)).toBe(false);
  });
});

describe("getDeckRevision / isTeamEditableDeck / assertTeamEditableCardWriteRevision", () => {
  test("getDeckRevision defaults missing to 0", () => {
    const d = baseDeck({
      visibility: "team",
      teamId,
      teamCollaboration: "team_editable",
    });
    expect(getDeckRevision(d)).toBe(0);
    expect(getDeckRevision({ ...d, revision: 3 } as Doc<"decks">)).toBe(3);
  });

  test("isTeamEditableDeck is true only for team + team_editable", () => {
    expect(
      isTeamEditableDeck(
        baseDeck({ visibility: "team", teamId, teamCollaboration: "team_editable" }),
      ),
    ).toBe(true);
    expect(
      isTeamEditableDeck(
        baseDeck({ visibility: "team", teamId, teamCollaboration: "team_viewable" }),
      ),
    ).toBe(false);
  });

  test("assertTeamEditableCardWriteRevision throws CONFLICT on mismatch", () => {
    const d = baseDeck({
      visibility: "team",
      teamId,
      teamCollaboration: "team_editable",
      revision: 2,
    }) as Doc<"decks">;
    expect(() => assertTeamEditableCardWriteRevision(d, 1)).toThrow("CONFLICT");
    expect(() => assertTeamEditableCardWriteRevision(d, 2)).not.toThrow();
  });

  test("assertTeamEditableCardWriteRevision is no-op for team_viewable", () => {
    const d = baseDeck({
      visibility: "team",
      teamId,
      teamCollaboration: "team_viewable",
      revision: 0,
    }) as Doc<"decks">;
    expect(() => assertTeamEditableCardWriteRevision(d, undefined)).not.toThrow();
  });

  test("assertTeamEditableCardWriteRevision requires expectedRevision for team_editable", () => {
    const d = baseDeck({
      visibility: "team",
      teamId,
      teamCollaboration: "team_editable",
      revision: 0,
    }) as Doc<"decks">;
    expect(() => assertTeamEditableCardWriteRevision(d, undefined)).toThrow("CONFLICT");
  });
});
