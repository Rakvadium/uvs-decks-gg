import { describe, expect, test } from "bun:test";
import { buildCopiesTowardLimit, canAddCardToSection } from "../shared/games/uvs/card-eligibility";

const cards: Record<string, { oracleId?: string }> = {
  wtnc: { oracleId: "bombus" },
  judge: { oracleId: "bombus" },
  other: { oracleId: "minotaur" },
  noOracle: {},
};
const getCard = (id: string) => cards[id];

describe("buildCopiesTowardLimit", () => {
  test("sums main and side copies across printings of the same card", () => {
    const copies = buildCopiesTowardLimit(
      { mainCounts: { wtnc: 2, other: 1 }, sideCounts: { judge: 1 } },
      getCard,
    );
    expect(copies("wtnc")).toBe(3);
    expect(copies("judge")).toBe(3);
    expect(copies("other")).toBe(1);
  });

  test("counts a card without an oracleId on its own", () => {
    const copies = buildCopiesTowardLimit({ mainCounts: { noOracle: 2 }, sideCounts: {} }, getCard);
    expect(copies("noOracle")).toBe(2);
    expect(copies("unknown")).toBe(0);
  });
});

describe("canAddCardToSection with copiesTowardLimit", () => {
  const rules = { isMainDeckEligible: () => true, getCardCopyLimit: () => 3 };

  test("blocks a new printing once the card's other printings reach the limit", () => {
    const counts = { mainCounts: { wtnc: 3 }, sideCounts: {}, referenceCounts: {} };
    const withLimit = { ...counts, copiesTowardLimit: buildCopiesTowardLimit(counts, getCard) };
    expect(canAddCardToSection({ card: {}, cardId: "judge", section: "main", counts, rules })).toBe(true);
    expect(canAddCardToSection({ card: {}, cardId: "judge", section: "main", counts: withLimit, rules })).toBe(false);
  });
});
