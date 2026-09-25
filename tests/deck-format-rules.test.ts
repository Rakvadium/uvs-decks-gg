import { describe, expect, test } from "bun:test";
import { runDeckValidation } from "../convex/lib/deckFormatRules";
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { QueryCtx } from "../convex/_generated/server";

// Characterization tests: lock in current validation behavior before the multi-game refactor.

type CardInput = Partial<Doc<"cards">> & { id: string; name?: string };

function makeCard(input: CardInput): Doc<"cards"> {
  const { id, ...rest } = input;
  return {
    _id: id as Id<"cards">,
    _creationTime: 0,
    name: input.name ?? id,
    isFrontFace: true,
    isVariant: false,
    setCode: "set",
    difficulty: 2,
    control: 4,
    type: "Attack",
    ...rest,
  } as Doc<"cards">;
}

function makeFormat(overrides: Partial<Doc<"formats">> = {}): Doc<"formats"> {
  return {
    _id: "fmt1" as Id<"formats">,
    _creationTime: 0,
    key: "standard",
    name: "Standard",
    isDefault: true,
    minDeckSize: 3,
    sideboardRule: "exact:10",
    defaultCopyLimit: 4,
    requiresStartingCharacter: true,
    requiresIdentity: true,
    ...overrides,
  } as Doc<"formats">;
}

function makeDeck(overrides: Partial<Doc<"decks">> = {}): Doc<"decks"> {
  return {
    _id: "deck1" as Id<"decks">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    name: "Deck",
    isPublic: false,
    visibility: "private",
    format: "standard",
    mainCardIds: [],
    mainQuantities: {},
    sideCardIds: [],
    sideQuantities: {},
    referenceCardIds: [],
    referenceQuantities: {},
    ...overrides,
  } as Doc<"decks">;
}

type LegalityInput = {
  formatKey?: string;
  cardId: string;
  status: "legal" | "banned" | "restricted";
  copyLimitOverride?: number;
  effectiveDate?: number;
};

function makeCtx(cards: Doc<"cards">[], legality: LegalityInput[] = []): QueryCtx {
  const byId = new Map<string, unknown>(cards.map((c) => [c._id as string, c]));
  const rows = legality.map((row, i) => ({
    _id: `leg${i}`,
    _creationTime: 0,
    formatKey: row.formatKey ?? "standard",
    ...row,
  }));
  const db = {
    get: async (id: string) => byId.get(id) ?? null,
    query: (table: string) => {
      if (table !== "cardLegality") throw new Error(`unexpected table ${table}`);
      return {
        withIndex: (_index: string, build: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => {
          let wanted: unknown;
          const q = {
            eq: (_field: string, value: unknown) => {
              wanted = value;
              return q;
            },
          };
          build(q);
          return {
            collect: async () => rows.filter((r) => r.formatKey === wanted),
          };
        },
      };
    },
  };
  return { db } as unknown as QueryCtx;
}

function codes(list: { code: string }[]) {
  return list.map((e) => e.code);
}

// Four legal fire cards used to satisfy min deck size.
function filler(prefix = "f", symbols = "fire") {
  return [1, 2, 3].map((n) => makeCard({ id: `${prefix}${n}`, name: `Filler ${n}`, symbols }));
}

const starter = makeCard({
  id: "char1",
  name: "Hero",
  type: "Character",
  symbols: "fire|water|air",
  difficulty: undefined,
  control: undefined,
});

function standardDeck(extraMain: Record<string, number> = {}, overrides: Partial<Doc<"decks">> = {}) {
  const fill = filler();
  const mainQuantities: Record<string, number> = { char1: 1 };
  for (const c of fill) mainQuantities[c._id] = 1;
  Object.assign(mainQuantities, extraMain);
  return makeDeck({
    startingCharacterId: starter._id,
    selectedIdentity: "fire",
    mainCardIds: Object.keys(mainQuantities) as Id<"cards">[],
    mainQuantities,
    ...overrides,
  });
}

describe("runDeckValidation: standard", () => {
  const format = makeFormat();

  test("a well-formed standard deck produces no errors or warnings", async () => {
    const ctx = makeCtx([starter, ...filler()]);
    const result = await runDeckValidation(ctx, standardDeck(), format);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  test("missing starting character and identity", async () => {
    const ctx = makeCtx([...filler()]);
    const deck = makeDeck({
      mainQuantities: { f1: 1, f2: 1, f3: 1 },
      mainCardIds: ["f1", "f2", "f3"] as Id<"cards">[],
    });
    const result = await runDeckValidation(ctx, deck, format);
    expect(result.errors).toEqual([
      { code: "NO_STARTING_CHARACTER", message: "Standard requires a starting character" },
      { code: "NO_IDENTITY", message: "Standard requires a symbol selection" },
    ]);
  });

  test("whitespace-only identity counts as missing and skips identity matching", async () => {
    const off = makeCard({ id: "off", symbols: "water" });
    const ctx = makeCtx([starter, ...filler(), off]);
    const result = await runDeckValidation(ctx, standardDeck({ off: 1 }, { selectedIdentity: "   " }), format);
    expect(codes(result.errors)).toEqual(["NO_IDENTITY"]);
  });

  test("starting character of wrong type", async () => {
    const notChar = makeCard({ id: "char1", type: "Attack", symbols: "fire" });
    const ctx = makeCtx([notChar, ...filler()]);
    const result = await runDeckValidation(ctx, standardDeck(), format);
    expect(result.errors).toContainEqual({
      code: "INVALID_STARTING_CHARACTER_TYPE",
      message: "Starting character must be a Character card",
    });
  });

  test("character type check is case-insensitive but requires exact word", async () => {
    for (const [type, ok] of [
      ["character", true],
      ["CHARACTER", true],
      ["Character Token", false],
      [undefined, false],
    ] as const) {
      const c = makeCard({ id: "char1", type, symbols: "fire", difficulty: undefined, control: undefined });
      const result = await runDeckValidation(makeCtx([c, ...filler()]), standardDeck(), format);
      expect(codes(result.errors).includes("INVALID_STARTING_CHARACTER_TYPE")).toBe(!ok);
    }
  });

  test("starting character id that does not resolve yields no type error", async () => {
    const ctx = makeCtx([...filler()]);
    const result = await runDeckValidation(ctx, standardDeck(), format);
    expect(codes(result.errors)).toEqual([]);
  });

  test("deck size excludes the starting character", async () => {
    const ctx = makeCtx([starter, ...filler()]);
    const deck = standardDeck({}, {});
    delete (deck.mainQuantities as Record<string, number>).f3;
    const result = await runDeckValidation(ctx, deck, format);
    expect(result.errors).toEqual([
      {
        code: "DECK_TOO_SMALL",
        message: "Main deck has 2 cards (excluding starting character), minimum is 3",
      },
    ]);
  });

  test("deck size counts starter quantity when starter is not in main", async () => {
    const ctx = makeCtx([starter, ...filler()]);
    const deck = standardDeck();
    delete (deck.mainQuantities as Record<string, number>).char1;
    const result = await runDeckValidation(ctx, deck, makeFormat({ maxDeckSize: 3 }));
    expect(result.errors).toEqual([]);
  });

  test("deck too large when maxDeckSize set", async () => {
    const ctx = makeCtx([starter, ...filler()]);
    const result = await runDeckValidation(ctx, standardDeck({ f1: 2 }), makeFormat({ maxDeckSize: 3 }));
    expect(result.errors).toEqual([
      {
        code: "DECK_TOO_LARGE",
        message: "Main deck has 4 cards (excluding starting character), maximum is 3",
      },
    ]);
  });

  test("mainCount sums zero/negative quantities too (raw sum)", async () => {
    const ctx = makeCtx([starter, ...filler()]);
    const result = await runDeckValidation(ctx, standardDeck({ f1: 3, f2: -1 }), format);
    // 3 + -1 + 1 = 3 (>= min 3). f2 is excluded from card checks because qty <= 0.
    expect(result.errors).toEqual([]);
  });

  describe("sideboard rules", () => {
    const side = (n: number) => ({ sideQuantities: { f1: n }, sideCardIds: ["f1"] as Id<"cards">[] });

    test("exact:N allows 0 or N, rejects anything else", async () => {
      const ctx = makeCtx([starter, ...filler()]);
      expect((await runDeckValidation(ctx, standardDeck({}, side(0)), format)).errors).toEqual([]);
      expect((await runDeckValidation(ctx, standardDeck({}, side(10)), format)).errors).toEqual([]);
      expect((await runDeckValidation(ctx, standardDeck({}, side(3)), format)).errors).toEqual([
        { code: "INVALID_SIDEBOARD_SIZE", message: "Sideboard must be exactly 0 or 10 cards, has 3" },
      ]);
    });

    test("max:N rejects over max", async () => {
      const ctx = makeCtx([starter, ...filler()]);
      const f = makeFormat({ sideboardRule: "max:2", defaultCopyLimit: 10 });
      expect((await runDeckValidation(ctx, standardDeck({}, side(2)), f)).errors).toEqual([]);
      expect((await runDeckValidation(ctx, standardDeck({}, side(3)), f)).errors).toEqual([
        { code: "SIDEBOARD_TOO_LARGE", message: "Sideboard has 3 cards, maximum is 2" },
      ]);
    });

    test("unparseable or unknown rules are ignored", async () => {
      const ctx = makeCtx([starter, ...filler()]);
      for (const rule of ["exact:abc", "max:", "none", ""]) {
        const result = await runDeckValidation(ctx, standardDeck({}, side(7)), makeFormat({ sideboardRule: rule }));
        expect(result.errors).toEqual([]);
      }
    });

    test("sideboard copies do not count toward main copy limit in standard", async () => {
      const ctx = makeCtx([starter, ...filler()]);
      const deck = standardDeck({ f1: 4 }, side(10));
      const result = await runDeckValidation(ctx, deck, format);
      expect(result.errors).toEqual([]);
    });
  });

  describe("copy limits grouped by oracleId", () => {
    test("printings sharing an oracleId are summed", async () => {
      const a = makeCard({ id: "a", name: "Punch A", oracleId: "punch", symbols: "fire" });
      const b = makeCard({ id: "b", name: "Punch B", oracleId: " punch ", symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), a, b]);
      const result = await runDeckValidation(ctx, standardDeck({ a: 3, b: 2 }), format);
      expect(result.errors).toEqual([
        {
          code: "EXCEEDS_COPY_LIMIT",
          message: "Punch A has 5 copies in the main deck across printings, maximum is 4",
          cardId: "a" as Id<"cards">,
          section: "main",
        },
      ]);
    });

    test("cards without oracleId group by their own id", async () => {
      const a = makeCard({ id: "a", name: "Same", symbols: "fire" });
      const b = makeCard({ id: "b", name: "Same", symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), a, b]);
      const result = await runDeckValidation(ctx, standardDeck({ a: 3, b: 3 }), format);
      expect(result.errors).toEqual([]);
    });

    test("group limit is the minimum per-card limit, capped at the format default", async () => {
      const lo = makeCard({ id: "lo", name: "Lo", oracleId: "o", copyLimit: 1, symbols: "fire" });
      const hi = makeCard({ id: "hi", name: "Hi", oracleId: "o", copyLimit: 6, symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), lo, hi]);
      const r1 = await runDeckValidation(ctx, standardDeck({ lo: 1, hi: 1 }), format);
      expect(r1.errors[0]?.message).toBe("Lo has 2 copies in the main deck across printings, maximum is 1");

      // Characterization: a per-card copyLimit ABOVE the default is capped at defaultCopyLimit in standard.
      const ctx2 = makeCtx([starter, ...filler(), hi]);
      const r2 = await runDeckValidation(ctx2, standardDeck({ hi: 5 }), format);
      expect(r2.errors).toEqual([
        {
          code: "EXCEEDS_COPY_LIMIT",
          message: "Hi has 5 copies in the main deck across printings, maximum is 4",
          cardId: "hi" as Id<"cards">,
          section: "main",
        },
      ]);
    });

    test("copyLimit null on any printing makes the whole group unlimited", async () => {
      const a = makeCard({ id: "a", oracleId: "o", copyLimit: 1, symbols: "fire" });
      const b = makeCard({ id: "b", oracleId: "o", copyLimit: null as unknown as number, symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), a, b]);
      const result = await runDeckValidation(ctx, standardDeck({ a: 10, b: 10 }), format);
      expect(result.errors).toEqual([]);
    });
  });

  describe("card legality", () => {
    test("banned cards in main and side are reported with section", async () => {
      const bad = makeCard({ id: "bad", name: "Bad", symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), bad], [{ cardId: "bad", status: "banned" }]);
      const deck = standardDeck(
        { bad: 1 },
        { sideQuantities: { bad: 10 }, sideCardIds: ["bad"] as Id<"cards">[] },
      );
      const result = await runDeckValidation(ctx, deck, format);
      expect(result.errors).toEqual([
        { code: "BANNED_CARD", message: "Bad is banned in this format", cardId: "bad" as Id<"cards">, section: "main" },
        { code: "BANNED_CARD", message: "Bad is banned in this format", cardId: "bad" as Id<"cards">, section: "side" },
      ]);
    });

    test("future effectiveDate and other formats are ignored", async () => {
      const bad = makeCard({ id: "bad", name: "Bad", symbols: "fire" });
      const ctx = makeCtx(
        [starter, ...filler(), bad],
        [
          { cardId: "bad", status: "banned", effectiveDate: Date.now() + 1e9 },
          { cardId: "bad", status: "banned", formatKey: "other" },
        ],
      );
      // Map keeps the last row per card for the queried format only.
      const result = await runDeckValidation(ctx, standardDeck({ bad: 1 }), format);
      expect(result.errors).toEqual([]);
    });

    test("past effectiveDate applies", async () => {
      const bad = makeCard({ id: "bad", name: "Bad", symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), bad], [{ cardId: "bad", status: "banned", effectiveDate: 1 }]);
      const result = await runDeckValidation(ctx, standardDeck({ bad: 1 }), format);
      expect(codes(result.errors)).toEqual(["BANNED_CARD"]);
    });

    test("restricted defaults to 1 copy across printings; override uses min and plural", async () => {
      const a = makeCard({ id: "a", name: "Res", oracleId: "r", symbols: "fire" });
      const b = makeCard({ id: "b", name: "Res B", oracleId: "r", symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), a, b], [{ cardId: "b", status: "restricted" }]);
      const result = await runDeckValidation(ctx, standardDeck({ a: 1, b: 1 }), format);
      expect(result.errors).toEqual([
        {
          code: "EXCEEDS_RESTRICTED_LIMIT",
          message: "Res is restricted to 1 copy in the main deck",
          cardId: "a" as Id<"cards">,
          section: "main",
        },
      ]);

      const ctx2 = makeCtx(
        [starter, ...filler(), a, b],
        [
          { cardId: "a", status: "restricted", copyLimitOverride: 3 },
          { cardId: "b", status: "restricted", copyLimitOverride: 2 },
        ],
      );
      const r2 = await runDeckValidation(ctx2, standardDeck({ a: 2, b: 1 }), format);
      expect(r2.errors.map((e) => e.message)).toEqual(["Res is restricted to 2 copies in the main deck"]);
    });

    test("restricted only counts main deck copies", async () => {
      const a = makeCard({ id: "a", name: "Res", symbols: "fire" });
      const ctx = makeCtx([starter, ...filler(), a], [{ cardId: "a", status: "restricted" }]);
      const deck = standardDeck({ a: 1 }, { sideQuantities: { a: 10 }, sideCardIds: ["a"] as Id<"cards">[] });
      expect((await runDeckValidation(ctx, deck, format)).errors).toEqual([]);
    });
  });

  describe("identity symbols", () => {
    async function mismatch(symbols: string | undefined, identity = "fire", starterSymbols = "fire|water|air") {
      const c = makeCard({ id: "x", name: "X", symbols });
      const s = makeCard({ ...starter, id: "char1", symbols: starterSymbols });
      const ctx = makeCtx([s, ...filler("f", ""), c]);
      const result = await runDeckValidation(ctx, standardDeck({ x: 1 }, { selectedIdentity: identity }), format);
      return result.errors.some((e) => e.code === "IDENTITY_MISMATCH" && e.cardId === "x");
    }

    test("cards with no symbols always match", async () => {
      expect(await mismatch(undefined)).toBe(false);
      expect(await mismatch("")).toBe(false);
    });

    test("infinity matches any identity", async () => {
      expect(await mismatch("infinity")).toBe(false);
      expect(await mismatch("water|Infinity")).toBe(false);
    });

    test("normal symbols must include the identity (case-insensitive, | or , separated)", async () => {
      expect(await mismatch("fire")).toBe(false);
      expect(await mismatch("Water|FIRE")).toBe(false);
      expect(await mismatch("water, fire")).toBe(false);
      expect(await mismatch("water")).toBe(true);
      expect(await mismatch("water", " FIRE ")).toBe(true);
      expect(await mismatch("fire", " FIRE ")).toBe(false);
    });

    test("attuned-only symbols require the starting character to have the base symbol", async () => {
      expect(await mismatch("attuned:water")).toBe(false);
      expect(await mismatch("Attuned-Water")).toBe(false);
      expect(await mismatch("attuned:death")).toBe(true);
      // Identity is irrelevant when only attuned tokens exist.
      expect(await mismatch("attuned:water", "evil")).toBe(false);
    });

    test("any one attuned base in the starter satisfies the attuned check", async () => {
      expect(await mismatch("attuned:death|attuned:water")).toBe(false);
    });

    test("mixed normal + attuned requires both", async () => {
      expect(await mismatch("fire|attuned:water")).toBe(false);
      expect(await mismatch("fire|attuned:death")).toBe(true);
      expect(await mismatch("water|attuned:water")).toBe(true);
    });

    test("mismatch error shape", async () => {
      const c = makeCard({ id: "x", name: "X", symbols: "water" });
      const ctx = makeCtx([starter, ...filler(), c]);
      const result = await runDeckValidation(ctx, standardDeck({ x: 1 }), format);
      expect(result.errors).toEqual([
        {
          code: "IDENTITY_MISMATCH",
          message: "X does not match deck identity or attuned rules",
          cardId: "x" as Id<"cards">,
          section: "main",
        },
      ]);
      expect(result.warnings).toEqual([]);
    });

    test("sideboard cards are not identity checked in standard", async () => {
      const c = makeCard({ id: "x", name: "X", symbols: "water" });
      const ctx = makeCtx([starter, ...filler(), c]);
      const deck = standardDeck({}, { sideQuantities: { x: 10 }, sideCardIds: ["x"] as Id<"cards">[] });
      expect((await runDeckValidation(ctx, deck, format)).errors).toEqual([]);
    });

    test("starting character in main is identity checked like any card", async () => {
      const s = makeCard({ ...starter, id: "char1", symbols: "water" });
      const ctx = makeCtx([s, ...filler()]);
      const result = await runDeckValidation(ctx, standardDeck(), format);
      expect(result.errors.map((e) => [e.code, e.cardId])).toEqual([["IDENTITY_MISMATCH", "char1"]]);
    });
  });

  describe("main cards missing difficulty/control", () => {
    test("reports missing stats but skips the starting character", async () => {
      const noDiff = makeCard({ id: "nd", name: "NoDiff", symbols: "fire", difficulty: undefined });
      const noCtl = makeCard({ id: "nc", name: "NoCtl", symbols: "fire", control: null as unknown as number });
      const ctx = makeCtx([starter, ...filler(), noDiff, noCtl]);
      const result = await runDeckValidation(ctx, standardDeck({ nd: 1, nc: 1 }), format);
      expect(result.errors).toEqual([
        {
          code: "MAIN_CARD_MISSING_STATS",
          message: "NoDiff must have difficulty and check (control) to be in the main deck",
          cardId: "nd" as Id<"cards">,
          section: "main",
        },
        {
          code: "MAIN_CARD_MISSING_STATS",
          message: "NoCtl must have difficulty and check (control) to be in the main deck",
          cardId: "nc" as Id<"cards">,
          section: "main",
        },
      ]);
    });

    test("sideboard cards without stats are allowed", async () => {
      const noDiff = makeCard({ id: "nd", symbols: "fire", difficulty: undefined });
      const ctx = makeCtx([starter, ...filler(), noDiff]);
      const deck = standardDeck({}, { sideQuantities: { nd: 10 }, sideCardIds: ["nd"] as Id<"cards">[] });
      expect((await runDeckValidation(ctx, deck, format)).errors).toEqual([]);
    });
  });

  test("error ordering across categories", async () => {
    const bad = makeCard({ id: "bad", name: "Bad", symbols: "water", difficulty: undefined });
    const ctx = makeCtx([starter, bad], [{ cardId: "bad", status: "banned" }]);
    const deck = makeDeck({
      startingCharacterId: starter._id,
      selectedIdentity: "fire",
      mainQuantities: { char1: 1, bad: 5 },
      sideQuantities: { bad: 1 },
    });
    const result = await runDeckValidation(ctx, deck, makeFormat({ minDeckSize: 40, maxDeckSize: 4 }));
    expect(codes(result.errors)).toEqual([
      "DECK_TOO_SMALL",
      "DECK_TOO_LARGE",
      "INVALID_SIDEBOARD_SIZE",
      "BANNED_CARD",
      "BANNED_CARD",
      "EXCEEDS_COPY_LIMIT",
      "IDENTITY_MISMATCH",
      "MAIN_CARD_MISSING_STATS",
    ]);
  });
});

describe("runDeckValidation: legacy (non-standard key)", () => {
  const format = makeFormat({
    key: "legacy",
    minDeckSize: 3,
    requiresStartingCharacter: false,
    requiresIdentity: false,
  });

  function legacyDeck(main: Record<string, number>, overrides: Partial<Doc<"decks">> = {}) {
    return makeDeck({
      format: "legacy",
      mainQuantities: main,
      mainCardIds: Object.keys(main) as Id<"cards">[],
      ...overrides,
    });
  }

  test("valid deck, no starting character or identity needed", async () => {
    const ctx = makeCtx(filler());
    expect(await runDeckValidation(ctx, legacyDeck({ f1: 1, f2: 1, f3: 1 }), format)).toEqual({
      errors: [],
      warnings: [],
    });
  });

  test("size checks count every main card (no starter exclusion)", async () => {
    const ctx = makeCtx([starter, ...filler()]);
    const small = await runDeckValidation(
      ctx,
      legacyDeck({ f1: 1 }, { startingCharacterId: starter._id }),
      format,
    );
    expect(small.errors).toEqual([{ code: "DECK_TOO_SMALL", message: "Main deck has 1 cards, minimum is 3" }]);

    const large = await runDeckValidation(
      ctx,
      legacyDeck({ char1: 1, f1: 1, f2: 1, f3: 1 }),
      makeFormat({ ...format, maxDeckSize: 3 }),
    );
    expect(large.errors).toEqual([{ code: "DECK_TOO_LARGE", message: "Main deck has 4 cards, maximum is 3" }]);
  });

  test("sideboard rules use legacy messages", async () => {
    const ctx = makeCtx(filler());
    const exact = await runDeckValidation(
      ctx,
      legacyDeck({ f1: 1, f2: 1, f3: 1 }, { sideQuantities: { f1: 2 }, sideCardIds: ["f1"] as Id<"cards">[] }),
      format,
    );
    expect(exact.errors).toEqual([
      { code: "INVALID_SIDEBOARD_SIZE", message: "Sideboard must have exactly 0 or 10 cards, has 2" },
    ]);
    const max = await runDeckValidation(
      ctx,
      legacyDeck({ f1: 1, f2: 1, f3: 1 }, { sideQuantities: { f2: 3 }, sideCardIds: ["f2"] as Id<"cards">[] }),
      makeFormat({ ...format, sideboardRule: "max:2" }),
    );
    expect(max.errors).toEqual([{ code: "SIDEBOARD_TOO_LARGE", message: "Sideboard has 3 cards, maximum is 2" }]);
  });

  test("requiresStartingCharacter / requiresIdentity flags", async () => {
    const ctx = makeCtx(filler());
    const f = makeFormat({ ...format, requiresStartingCharacter: true, requiresIdentity: true });
    const result = await runDeckValidation(ctx, legacyDeck({ f1: 1, f2: 1, f3: 1 }), f);
    expect(result.errors).toEqual([
      { code: "NO_STARTING_CHARACTER", message: "This format requires a starting character" },
      { code: "NO_IDENTITY", message: "This format requires a symbol selection" },
    ]);
    // Whitespace identity passes the legacy truthiness check.
    const ws = await runDeckValidation(ctx, legacyDeck({ f1: 1, f2: 1, f3: 1 }, { selectedIdentity: " " }), f);
    expect(codes(ws.errors)).toEqual(["NO_STARTING_CHARACTER"]);
  });

  test("starting character type and card stats are not checked", async () => {
    const notChar = makeCard({ id: "char1", type: "Attack", difficulty: undefined });
    const ctx = makeCtx([notChar, ...filler()]);
    const result = await runDeckValidation(
      ctx,
      legacyDeck({ char1: 1, f1: 1, f2: 1 }, { startingCharacterId: notChar._id }),
      format,
    );
    expect(result.errors).toEqual([]);
  });

  test("copy limits combine main + side per card id (no oracle grouping) and honour per-card limits", async () => {
    const a = makeCard({ id: "a", name: "A", oracleId: "same" });
    const b = makeCard({ id: "b", name: "B", oracleId: "same" });
    const hi = makeCard({ id: "hi", name: "Hi", copyLimit: 6 });
    const ctx = makeCtx([...filler(), a, b, hi]);
    const deck = legacyDeck(
      { a: 3, b: 3, hi: 6 },
      { sideQuantities: { a: 2 }, sideCardIds: ["a"] as Id<"cards">[] },
    );
    const result = await runDeckValidation(ctx, deck, makeFormat({ ...format, sideboardRule: "none" }));
    expect(result.errors).toEqual([
      { code: "EXCEEDS_COPY_LIMIT", message: "A has 5 copies, maximum is 4", cardId: "a" as Id<"cards"> },
    ]);
  });

  test("copyLimit null means unlimited", async () => {
    const u = makeCard({ id: "u", name: "U", copyLimit: null as unknown as number });
    const ctx = makeCtx([u]);
    expect((await runDeckValidation(ctx, legacyDeck({ u: 50 }), format)).errors).toEqual([]);
  });

  test("cards are loaded from mainCardIds/sideCardIds, not quantity keys", async () => {
    const a = makeCard({ id: "a", name: "A" });
    const ctx = makeCtx([a], [{ cardId: "a", status: "banned", formatKey: "legacy" }]);
    // Quantity key present but id missing from mainCardIds -> copy limit skipped; ban reported as Unknown card.
    const deck = makeDeck({ format: "legacy", mainQuantities: { a: 9 }, mainCardIds: [] });
    const result = await runDeckValidation(ctx, deck, format);
    expect(result.errors).toEqual([
      { code: "BANNED_CARD", message: "Unknown card is banned in this format", cardId: undefined },
    ]);
  });

  test("banned and restricted (combined main+side counts)", async () => {
    const bad = makeCard({ id: "bad", name: "Bad" });
    const res = makeCard({ id: "res", name: "Res" });
    const res2 = makeCard({ id: "res2", name: "Res2" });
    const ctx = makeCtx(
      [bad, res, res2],
      [
        { cardId: "bad", status: "banned", formatKey: "legacy" },
        { cardId: "res", status: "restricted", formatKey: "legacy" },
        { cardId: "res2", status: "restricted", formatKey: "legacy", copyLimitOverride: 2 },
        { cardId: "bad", status: "banned", formatKey: "standard" },
      ],
    );
    const deck = legacyDeck(
      { bad: 1, res: 1, res2: 2 },
      { sideQuantities: { res: 1, res2: 1 }, sideCardIds: ["res", "res2"] as Id<"cards">[] },
    );
    const result = await runDeckValidation(ctx, deck, makeFormat({ ...format, sideboardRule: "none" }));
    expect(result.errors).toEqual([
      { code: "BANNED_CARD", message: "Bad is banned in this format", cardId: "bad" as Id<"cards"> },
      { code: "EXCEEDS_RESTRICTED_LIMIT", message: "Res is restricted to 1 copy", cardId: "res" as Id<"cards"> },
      { code: "EXCEEDS_RESTRICTED_LIMIT", message: "Res2 is restricted to 2 copies", cardId: "res2" as Id<"cards"> },
    ]);
  });

  test("future-dated legality is ignored", async () => {
    const bad = makeCard({ id: "bad", name: "Bad" });
    const ctx = makeCtx(
      [bad, ...filler()],
      [{ cardId: "bad", status: "banned", formatKey: "legacy", effectiveDate: Date.now() + 1e9 }],
    );
    expect((await runDeckValidation(ctx, legacyDeck({ bad: 1, f1: 1, f2: 1 }), format)).errors).toEqual([]);
  });

  test("identity mismatches are warnings, split on | only, include side, no attuned handling", async () => {
    const water = makeCard({ id: "w", name: "Water", symbols: "water" });
    const inf = makeCard({ id: "i", name: "Inf", symbols: "Infinity" });
    const none = makeCard({ id: "n", name: "None" });
    const comma = makeCard({ id: "c", name: "Comma", symbols: "water, fire" });
    const attuned = makeCard({ id: "at", name: "Att", symbols: "attuned:fire" });
    const fire = makeCard({ id: "fi", name: "Fire", symbols: "Water | FIRE" });
    const side = makeCard({ id: "s", name: "Side", symbols: "death" });
    const ctx = makeCtx([water, inf, none, comma, attuned, fire, side]);
    const deck = legacyDeck(
      { w: 1, i: 1, n: 1, c: 1, at: 1, fi: 1 },
      { selectedIdentity: "Fire", sideQuantities: { s: 1 }, sideCardIds: ["s"] as Id<"cards">[] },
    );
    const result = await runDeckValidation(ctx, deck, makeFormat({ ...format, sideboardRule: "none" }));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      { code: "IDENTITY_MISMATCH", message: 'Water does not match deck symbols "Fire"', cardId: "w" as Id<"cards"> },
      { code: "IDENTITY_MISMATCH", message: 'Comma does not match deck symbols "Fire"', cardId: "c" as Id<"cards"> },
      { code: "IDENTITY_MISMATCH", message: 'Att does not match deck symbols "Fire"', cardId: "at" as Id<"cards"> },
      { code: "IDENTITY_MISMATCH", message: 'Side does not match deck symbols "Fire"', cardId: "s" as Id<"cards"> },
    ]);
  });
});
