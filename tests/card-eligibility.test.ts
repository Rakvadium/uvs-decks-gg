import { describe, expect, test } from "bun:test";
import {
  canAddCardToDeck,
  canAddCardToSection,
  canMoveCardToSection,
  getCardCopyLimit,
  getCardSectionCounts,
  type DeckSectionCounts,
} from "../src/lib/deck/card-eligibility";

const playable = { difficulty: 3, control: 4 };

function counts(main = 0, side = 0, reference = 0): DeckSectionCounts {
  return {
    mainCounts: main ? { c: main } : {},
    sideCounts: side ? { c: side } : {},
    referenceCounts: reference ? { c: reference } : {},
  };
}

describe("canAddCardToDeck", () => {
  test("null/undefined card is allowed", () => {
    expect(canAddCardToDeck(null)).toBe(true);
    expect(canAddCardToDeck(undefined)).toBe(true);
  });

  test("requires numeric difficulty and control", () => {
    expect(canAddCardToDeck(playable)).toBe(true);
    expect(canAddCardToDeck({ difficulty: 0, control: 0 })).toBe(true);
    expect(canAddCardToDeck({ difficulty: 3 })).toBe(false);
    expect(canAddCardToDeck({ control: 3 })).toBe(false);
    expect(canAddCardToDeck({ difficulty: null, control: 3 })).toBe(false);
    expect(canAddCardToDeck({})).toBe(false);
  });
});

describe("getCardCopyLimit", () => {
  test("missing card, missing/null/non-positive/non-finite limit => Infinity", () => {
    expect(getCardCopyLimit(null)).toBe(Number.POSITIVE_INFINITY);
    expect(getCardCopyLimit({})).toBe(Number.POSITIVE_INFINITY);
    expect(getCardCopyLimit({ copyLimit: null })).toBe(Number.POSITIVE_INFINITY);
    expect(getCardCopyLimit({ copyLimit: 0 })).toBe(Number.POSITIVE_INFINITY);
    expect(getCardCopyLimit({ copyLimit: -2 })).toBe(Number.POSITIVE_INFINITY);
    expect(getCardCopyLimit({ copyLimit: Number.NaN })).toBe(Number.POSITIVE_INFINITY);
  });

  test("positive limit is returned as is", () => {
    expect(getCardCopyLimit({ copyLimit: 1 })).toBe(1);
    expect(getCardCopyLimit({ copyLimit: 4 })).toBe(4);
  });
});

describe("getCardSectionCounts", () => {
  test("sums sections and defaults missing ids to zero", () => {
    expect(getCardSectionCounts("c", counts(2, 1, 3))).toEqual({
      main: 2,
      side: 1,
      reference: 3,
      mainSide: 3,
      total: 6,
    });
    expect(getCardSectionCounts("missing", counts(2, 1, 3))).toEqual({
      main: 0,
      side: 0,
      reference: 0,
      mainSide: 0,
      total: 0,
    });
  });
});

describe("canAddCardToSection", () => {
  test("unplayable cards are rejected everywhere, even reference", () => {
    for (const section of ["main", "side", "reference"] as const) {
      expect(canAddCardToSection({ card: {}, cardId: "c", section, counts: counts() })).toBe(false);
    }
  });

  test("reference ignores copy limits", () => {
    expect(
      canAddCardToSection({ card: { ...playable, copyLimit: 1 }, cardId: "c", section: "reference", counts: counts(1, 0, 9) }),
    ).toBe(true);
  });

  test("main/side share the copy limit; reference copies do not count", () => {
    const card = { ...playable, copyLimit: 4 };
    expect(canAddCardToSection({ card, cardId: "c", section: "main", counts: counts(2, 1, 5) })).toBe(true);
    expect(canAddCardToSection({ card, cardId: "c", section: "side", counts: counts(3, 1) })).toBe(false);
    expect(canAddCardToSection({ card, cardId: "c", section: "main", counts: counts(2, 1), quantity: 2 })).toBe(false);
  });

  test("quantity below 1 is treated as 1", () => {
    const card = { ...playable, copyLimit: 1 };
    expect(canAddCardToSection({ card, cardId: "c", section: "main", counts: counts(1), quantity: 0 })).toBe(false);
    expect(canAddCardToSection({ card, cardId: "c", section: "main", counts: counts(0), quantity: -5 })).toBe(true);
  });

  test("no copyLimit means unlimited; null card is allowed", () => {
    expect(canAddCardToSection({ card: playable, cardId: "c", section: "main", counts: counts(999) })).toBe(true);
    expect(canAddCardToSection({ card: null, cardId: "c", section: "main", counts: counts(999) })).toBe(true);
  });
});

describe("canMoveCardToSection", () => {
  const card = { ...playable, copyLimit: 2 };

  test("same section is always allowed, even for unplayable cards", () => {
    expect(
      canMoveCardToSection({ card: {}, cardId: "c", fromSection: "main", toSection: "main", counts: counts() }),
    ).toBe(true);
  });

  test("unplayable cards cannot move between sections", () => {
    expect(
      canMoveCardToSection({ card: {}, cardId: "c", fromSection: "main", toSection: "reference", counts: counts() }),
    ).toBe(false);
  });

  test("moving to reference or between main/side is always allowed", () => {
    expect(
      canMoveCardToSection({ card, cardId: "c", fromSection: "main", toSection: "reference", counts: counts(9) }),
    ).toBe(true);
    expect(
      canMoveCardToSection({ card, cardId: "c", fromSection: "main", toSection: "side", counts: counts(9, 9) }),
    ).toBe(true);
    expect(
      canMoveCardToSection({ card, cardId: "c", fromSection: "side", toSection: "main", counts: counts(9, 9) }),
    ).toBe(true);
  });

  test("moving from reference into main/side checks the copy limit", () => {
    expect(
      canMoveCardToSection({ card, cardId: "c", fromSection: "reference", toSection: "main", counts: counts(1, 0, 3) }),
    ).toBe(true);
    expect(
      canMoveCardToSection({ card, cardId: "c", fromSection: "reference", toSection: "side", counts: counts(1, 1, 3) }),
    ).toBe(false);
    expect(
      canMoveCardToSection({
        card,
        cardId: "c",
        fromSection: "reference",
        toSection: "main",
        counts: counts(0, 0, 3),
        quantity: 3,
      }),
    ).toBe(false);
  });
});
