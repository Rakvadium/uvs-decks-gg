import { describe, expect, test } from "bun:test";
import type { DeckRuleCard, DeckRuleDeck, DeckRuleFormat, DeckRuleLegality } from "@shared/games/deck";
import { getSharedGameModule } from "@shared/games/registry";
import { cyberpunkCopyGroupKey, cyberpunkLegendNameKey, cyberpunkRamBudget } from "@shared/games/cyberpunk/rules";
import { CYBERPUNK_DEFAULT_FORMATS } from "@shared/games/cyberpunk/formats";

const rules = getSharedGameModule("cyberpunk").deck.validation;
const FORMAT: DeckRuleFormat = CYBERPUNK_DEFAULT_FORMATS[0]!;

function legend(id: string, color: string | undefined, ram: number, name = `Legend ${id}`): DeckRuleCard {
  return { _id: id, name, type: "Legend", color, ram };
}

function card(id: string, overrides: Partial<DeckRuleCard> = {}): DeckRuleCard {
  return { _id: id, name: `Card ${id}`, type: "Unit", ...overrides };
}

const L1 = legend("l1", "red", 2);
const L2 = legend("l2", "red", 1);
const L3 = legend("l3", "blue", 3);
const LEGENDS = [L1, L2, L3];

/** 14 colorless units x3 = 42 cards (legal with LEGENDS). */
function fillerCards(count = 14): DeckRuleCard[] {
  return Array.from({ length: count }, (_, i) => card(`f${i}`, { name: `Filler ${i}` }));
}

interface Scenario {
  legendIds?: string[];
  legends?: DeckRuleCard[];
  main?: Array<[DeckRuleCard, number]>;
  side?: Array<[DeckRuleCard, number]>;
  legality?: DeckRuleLegality[];
  format?: Partial<DeckRuleFormat>;
  now?: number;
}

function run(s: Scenario = {}) {
  const legends = s.legends ?? LEGENDS;
  const legendIds = s.legendIds ?? legends.map((l) => l._id);
  const main = s.main ?? fillerCards().map((c) => [c, 3] as [DeckRuleCard, number]);
  const side = s.side ?? [];
  const deck: DeckRuleDeck = {
    format: "standard",
    setup: { game: "cyberpunk", legendIds },
    mainCardIds: main.map(([c]) => c._id),
    mainQuantities: Object.fromEntries(main.map(([c, q]) => [c._id, q])),
    sideCardIds: side.map(([c]) => c._id),
    sideQuantities: Object.fromEntries(side.map(([c, q]) => [c._id, q])),
  };
  const format = { ...FORMAT, ...s.format };
  const plan = rules.plan(deck, format);
  const all = new Map<string, DeckRuleCard>([...main, ...side].map(([c]) => [c._id, c]));
  const legendMap = new Map(legends.map((l) => [l._id, l]));
  const cards = new Map(plan.cardIds.flatMap((id) => (all.has(id) ? [[id, all.get(id)!] as const] : [])));
  const setupCards = new Map(plan.setupCardIds.map((id) => [id, legendMap.get(id) ?? null] as const));
  return rules.validate({ deck, format, cards, setupCards, legality: s.legality ?? [], now: s.now ?? 1000 });
}

const codes = (list: { code: string }[]) => list.map((e) => e.code);

describe("cyberpunk rules: baseline", () => {
  test("3 legends + 42 colorless cards is legal", () => {
    expect(run()).toEqual({ errors: [], warnings: [] });
  });

  test("plan loads main+side ids and unique legend ids", () => {
    const deck: DeckRuleDeck = {
      setup: { game: "cyberpunk", legendIds: ["l1", "l2", "l1"] },
      mainCardIds: ["a", "z"],
      mainQuantities: { a: 2, z: 0 },
      sideCardIds: ["s"],
      sideQuantities: { s: 1, a: 1 },
    };
    expect(rules.plan(deck, FORMAT)).toEqual({ cardIds: ["a", "s"], setupCardIds: ["l1", "l2"] });
  });

  test("a deck without a Cyberpunk setup has no legends", () => {
    const deck: DeckRuleDeck = { mainCardIds: [], mainQuantities: {}, sideCardIds: [], sideQuantities: {} };
    expect(rules.plan(deck, FORMAT).setupCardIds).toEqual([]);
    const out = rules.validate({ deck, format: FORMAT, cards: new Map(), setupCards: new Map(), legality: [], now: 0 });
    expect(codes(out.errors)).toEqual(["WRONG_LEGEND_COUNT", "DECK_TOO_SMALL"]);
  });
});

describe("cyberpunk rules: legends", () => {
  test("wrong legend count (too few / too many)", () => {
    expect(codes(run({ legendIds: ["l1", "l2"] }).errors)).toEqual(["WRONG_LEGEND_COUNT"]);
    const L4 = legend("l4", "green", 1);
    expect(codes(run({ legends: [...LEGENDS, L4] }).errors)).toEqual(["WRONG_LEGEND_COUNT"]);
    expect(run({ legendIds: [] }).errors[0]?.message).toBe("A deck needs exactly 3 Legends, has 0");
  });

  test("missing legend card", () => {
    expect(codes(run({ legendIds: ["l1", "l2", "gone"] }).errors)).toEqual(["LEGEND_NOT_FOUND"]);
  });

  test("legend of the wrong type", () => {
    const notLegend = card("u1", { name: "Unit pretending" });
    const out = run({ legends: [L1, L2, notLegend] });
    expect(codes(out.errors)).toEqual(["INVALID_LEGEND_TYPE"]);
    expect(out.errors[0]?.cardId).toBe("u1");
  });

  test("legend type is case-insensitive", () => {
    expect(run({ legends: [L1, L2, { ...L3, type: "legend" }] }).errors).toEqual([]);
  });

  test("duplicate legend names (different printings) and duplicate ids", () => {
    const twin = legend("l1b", "blue", 3, L1.name.toUpperCase());
    const out = run({ legends: [L1, L2, twin] });
    expect(codes(out.errors)).toEqual(["DUPLICATE_LEGEND_NAME"]);
    expect(out.errors[0]?.cardId).toBe("l1b");
    expect(codes(run({ legendIds: ["l1", "l2", "l1"] }).errors)).toEqual(["DUPLICATE_LEGEND_NAME"]);
  });

  test("two versions of the same character count as the same legend name", () => {
    const streetkid: DeckRuleCard = { ...legend("v1", "red", 2, "V: Streetkid"), subname: "Streetkid" };
    const corpo: DeckRuleCard = { ...legend("v2", "blue", 2, "V — Corpo Rat"), subname: "Corpo Rat" };
    const out = run({ legends: [streetkid, corpo, L3] });
    expect(codes(out.errors)).toEqual(["DUPLICATE_LEGEND_NAME"]);
    expect(out.errors[0]?.cardId).toBe("v2");
  });

  test("cyberpunkLegendNameKey strips the version subtitle only", () => {
    expect(cyberpunkLegendNameKey({ name: "V: Streetkid", subname: "Streetkid" })).toBe("v");
    expect(cyberpunkLegendNameKey({ name: "V, Streetkid", subname: "streetkid" })).toBe("v");
    expect(cyberpunkLegendNameKey({ name: "Goro Takemura — Hands Unclean", subname: "Hands Unclean" })).toBe("goro takemura");
    expect(cyberpunkLegendNameKey({ name: "Jackie Welles" })).toBe("jackie welles");
    expect(cyberpunkLegendNameKey({ name: "Streetkid", subname: "Streetkid" })).toBe("streetkid");
    expect(cyberpunkLegendNameKey({ name: "A (B)", subname: "(B)" })).toBe("a (b)");
  });

  test("legend without a color warns and provides no RAM", () => {
    const colorless = legend("lx", undefined, 3);
    const red = card("r1", { color: "red", ram: 3 });
    const out = run({
      legends: [L1, colorless, L3],
      main: [...fillerCards(13).map((c) => [c, 3] as [DeckRuleCard, number]), [red, 1]],
    });
    expect(codes(out.warnings)).toEqual(["LEGEND_MISSING_COLOR"]);
    // red budget is only L1's 2
    expect(codes(out.errors)).toEqual(["RAM_EXCEEDS_BUDGET"]);
  });
});

describe("cyberpunk rules: deck size + sideboard", () => {
  test("bounds 40..50 come from the format", () => {
    const fill = fillerCards(17);
    const deckOf = (n: number) => {
      const main: Array<[DeckRuleCard, number]> = [];
      let left = n;
      for (const c of fill) {
        if (left <= 0) break;
        const q = Math.min(3, left);
        main.push([c, q]);
        left -= q;
      }
      return main;
    };
    expect(codes(run({ main: deckOf(39) }).errors)).toEqual(["DECK_TOO_SMALL"]);
    expect(run({ main: deckOf(40) }).errors).toEqual([]);
    expect(run({ main: deckOf(50) }).errors).toEqual([]);
    expect(codes(run({ main: deckOf(51) }).errors)).toEqual(["DECK_TOO_LARGE"]);
    expect(run({ main: deckOf(51) }).errors[0]?.message).toBe(
      "Main deck has 51 cards (excluding Legends), maximum is 50",
    );
    expect(codes(run({ main: deckOf(20), format: { minDeckSize: 20 } }).errors)).toEqual([]);
  });

  test("no sideboard (max:0)", () => {
    const out = run({ side: [[card("s1"), 1]] });
    expect(codes(out.errors)).toEqual(["SIDEBOARD_TOO_LARGE"]);
  });
});

describe("cyberpunk rules: main deck contents", () => {
  test("legends in the main deck", () => {
    const stray = legend("l9", "red", 1);
    const out = run({ main: [...fillerCards(13).map((c) => [c, 3] as [DeckRuleCard, number]), [stray, 1]] });
    expect(codes(out.errors)).toEqual(["LEGEND_IN_MAIN_DECK"]);
    expect(out.errors[0]).toMatchObject({ cardId: "l9", section: "main" });
  });

  test("main card without a type", () => {
    const untyped = card("u0", { type: undefined });
    const out = run({ main: [...fillerCards(13).map((c) => [c, 3] as [DeckRuleCard, number]), [untyped, 1]] });
    expect(codes(out.errors)).toEqual(["MAIN_CARD_MISSING_TYPE"]);
  });
});

describe("cyberpunk rules: RAM budget", () => {
  test("budget sums legends of the same color; colorless legends add nothing", () => {
    expect(Object.fromEntries(cyberpunkRamBudget(LEGENDS))).toEqual({ red: 3, blue: 3 });
    expect(
      Object.fromEntries(cyberpunkRamBudget([legend("a", "Red ", 1), legend("b", "red", 2), legend("c", undefined, 5)])),
    ).toEqual({ red: 3 });
    expect(Object.fromEntries(cyberpunkRamBudget([{ color: "green", ram: null }]))).toEqual({ green: 0 });
  });

  function withExtra(extra: DeckRuleCard) {
    return run({ main: [...fillerCards(13).map((c) => [c, 3] as [DeckRuleCard, number]), [extra, 1]] });
  }

  test("card RAM up to the color budget is legal (multiple legends of one color)", () => {
    expect(withExtra(card("r3", { color: "red", ram: 3 })).errors).toEqual([]);
    expect(withExtra(card("b3", { color: "BLUE", ram: 3 })).errors).toEqual([]);
    expect(withExtra(card("r0", { color: "red" })).errors).toEqual([]);
  });

  test("card RAM over the budget", () => {
    const out = withExtra(card("r4", { color: "red", ram: 4 }));
    expect(codes(out.errors)).toEqual(["RAM_EXCEEDS_BUDGET"]);
    expect(out.errors[0]?.message).toBe("Card r4 needs 4 red RAM, Legends provide 3");
  });

  test("a color no legend provides is illegal even at RAM 0", () => {
    expect(codes(withExtra(card("g0", { color: "green", ram: 0 })).errors)).toEqual(["COLOR_NOT_PROVIDED"]);
    expect(codes(withExtra(card("g2", { color: "green", ram: 2 })).errors)).toEqual(["COLOR_NOT_PROVIDED"]);
  });

  test("a legend with RAM 0 gives a budget of 0", () => {
    const out = run({
      legends: [L1, L2, legend("y0", "yellow", 0)],
      main: [...fillerCards(13).map((c) => [c, 3] as [DeckRuleCard, number]), [card("y1", { color: "yellow", ram: 0 }), 1]],
    });
    expect(codes(out.errors)).toEqual(["COLOR_NOT_PROVIDED"]);
  });

  test("colorless cards skip the check", () => {
    expect(withExtra(card("c9", { color: "", ram: 9 })).errors).toEqual([]);
    expect(withExtra(card("c8", { ram: 9 })).errors).toEqual([]);
  });

  test("invalid legends do not provide RAM", () => {
    const fake = { ...legend("fake", "green", 3), type: "Unit" };
    const out = run({
      legends: [L1, L2, fake],
      main: [...fillerCards(13).map((c) => [c, 3] as [DeckRuleCard, number]), [card("g1", { color: "green", ram: 1 }), 1]],
    });
    expect(codes(out.errors)).toEqual(["INVALID_LEGEND_TYPE", "COLOR_NOT_PROVIDED"]);
  });
});

describe("cyberpunk rules: copy limits and legality", () => {
  const base = fillerCards(13).map((c) => [c, 3] as [DeckRuleCard, number]);

  test("copy limit: format default 3, grouped by oracleId then name", () => {
    expect(codes(run({ main: [...base, [card("x", { name: "X" }), 4]] }).errors)).toEqual(["EXCEEDS_COPY_LIMIT"]);
    const a = card("pa", { name: "Printing A", oracleId: "o1" });
    const b = card("pb", { name: "Printing B", oracleId: "o1" });
    const out = run({ main: [...base, [a, 2], [b, 2]] });
    expect(codes(out.errors)).toEqual(["EXCEEDS_COPY_LIMIT"]);
    expect(out.errors[0]).toMatchObject({ cardId: "pa", message: "Printing A has 4 copies, maximum is 3" });
    const n1 = card("n1", { name: "Same Name" });
    const n2 = card("n2", { name: "same name " });
    expect(codes(run({ main: [...base, [n1, 2], [n2, 2]] }).errors)).toEqual(["EXCEEDS_COPY_LIMIT"]);
    expect(run({ main: [...base, [n1, 1], [n2, 2]] }).errors).toEqual([]);
  });

  test("group keys", () => {
    expect(cyberpunkCopyGroupKey({ name: " Foo ", oracleId: " " })).toBe("name:foo");
    expect(cyberpunkCopyGroupKey({ name: "Foo", oracleId: "o" })).toBe("oracle:o");
  });

  test("card copyLimit overrides (higher, lower, unlimited)", () => {
    expect(run({ main: [...base, [card("h", { copyLimit: 5 }), 5]] }).errors).toEqual([]);
    expect(codes(run({ main: [...base, [card("o", { copyLimit: 1 }), 2]] }).errors)).toEqual(["EXCEEDS_COPY_LIMIT"]);
    expect(run({ main: [...base, [card("u", { copyLimit: null }), 9]] }).errors).toEqual([]);
  });

  test("banned (main, side, legend) respects effectiveDate", () => {
    const x = card("x");
    const banned: DeckRuleLegality[] = [{ cardId: "x", status: "banned" }];
    expect(codes(run({ main: [...base, [x, 1]], legality: banned }).errors)).toEqual(["BANNED_CARD"]);
    expect(
      run({ main: [...base, [x, 1]], legality: [{ cardId: "x", status: "banned", effectiveDate: 5000 }] }).errors,
    ).toEqual([]);
    expect(codes(run({ side: [[x, 1]], legality: banned }).errors)).toEqual(["SIDEBOARD_TOO_LARGE", "BANNED_CARD"]);
    const out = run({ legality: [{ cardId: "l3", status: "banned" }] });
    expect(codes(out.errors)).toEqual(["BANNED_CARD"]);
    expect(out.errors[0]?.cardId).toBe("l3");
  });

  test("restricted: default 1 copy, override, strictest printing wins", () => {
    const x = card("x", { oracleId: "ox" });
    const y = card("y", { oracleId: "ox" });
    expect(
      codes(run({ main: [...base, [x, 2]], legality: [{ cardId: "x", status: "restricted" }] }).errors),
    ).toEqual(["EXCEEDS_RESTRICTED_LIMIT"]);
    expect(
      run({ main: [...base, [x, 2]], legality: [{ cardId: "x", status: "restricted", copyLimitOverride: 2 }] }).errors,
    ).toEqual([]);
    const out = run({
      main: [...base, [x, 1], [y, 1]],
      legality: [
        { cardId: "x", status: "restricted", copyLimitOverride: 2 },
        { cardId: "y", status: "restricted", copyLimitOverride: 1 },
      ],
    });
    expect(out.errors).toEqual([
      { code: "EXCEEDS_RESTRICTED_LIMIT", message: "Card x is restricted to 1 copy", cardId: "x", section: "main" },
    ]);
  });

  test("last legality row per card wins", () => {
    const x = card("x");
    expect(
      run({
        main: [...base, [x, 1]],
        legality: [
          { cardId: "x", status: "banned" },
          { cardId: "x", status: "legal" },
        ],
      }).errors,
    ).toEqual([]);
  });
});
