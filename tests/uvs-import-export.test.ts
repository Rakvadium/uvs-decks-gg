import { describe, expect, test } from "bun:test";
import {
  SIDEBAR_SIDEBOARD_LIMIT,
  UVS_MAIN_TYPE_ORDER,
  buildCardNameIndex,
  findCardByName,
  formatUvsUltraDeckExport,
  incrementCount,
  parseUvsUltraDeck,
  sumLineEntries,
  sumQuantities,
  toCardId,
} from "../src/components/deck-details/uvs-import-export";
import type { CachedCard } from "../src/lib/universus/card-store";
import type { Id } from "../convex/_generated/dataModel";

function card(id: string, name: string, extra: Partial<CachedCard> = {}): CachedCard {
  return {
    _id: id as Id<"cards">,
    _creationTime: 0,
    name,
    isFrontFace: true,
    isVariant: false,
    setCode: "s",
    ...extra,
  } as CachedCard;
}

describe("constants", () => {
  test("sideboard limit and main type order", () => {
    expect(SIDEBAR_SIDEBOARD_LIMIT).toBe(10);
    expect([...UVS_MAIN_TYPE_ORDER]).toEqual(["Foundation", "Attack", "Asset", "Action", "Backup"]);
  });
});

describe("parseUvsUltraDeck", () => {
  test("parses character, main sections, and side", () => {
    const text = [
      "[b]Character[/b]",
      "1 Ryu",
      "",
      "[b]Foundation[/b]",
      "4 Focused Training",
      "[b]Attack[/b]",
      "3 Hadoken",
      "[b]Asset[/b]",
      "2 Gi",
      "[b]Action[/b]",
      "1 Rest",
      "[b]Backup[/b]",
      "1 Ken",
      "[b]Side[/b]",
      "2 Shoryuken",
    ].join("\r\n");
    expect(parseUvsUltraDeck(text)).toEqual({
      character: { name: "Ryu", quantity: 1 },
      main: [
        { name: "Focused Training", quantity: 4 },
        { name: "Hadoken", quantity: 3 },
        { name: "Gi", quantity: 2 },
        { name: "Rest", quantity: 1 },
        { name: "Ken", quantity: 1 },
      ],
      side: [{ name: "Shoryuken", quantity: 2 }],
    });
  });

  test("main entries do not carry a type", () => {
    const parsed = parseUvsUltraDeck("[b]Attack[/b]\n1 Jab");
    expect(parsed.main[0]).toEqual({ name: "Jab", quantity: 1 });
    expect(parsed.main[0]).not.toHaveProperty("type");
  });

  test("headings are case-insensitive, ignore non-letters, and accept plurals only for Sideboard", () => {
    const parsed = parseUvsUltraDeck(
      ["[B]CHARACTER:[/B]", "1 A", "[b]Side-board[/b]", "1 B", "[b]Attacks[/b]", "1 C", "[b]Sideboard[/b]", "1 D"].join("\n"),
    );
    expect(parsed.character).toEqual({ name: "A", quantity: 1 });
    // "Attacks" is unknown => section reset, C is dropped.
    expect(parsed.main).toEqual([]);
    expect(parsed.side).toEqual([
      { name: "B", quantity: 1 },
      { name: "D", quantity: 1 },
    ]);
  });

  test("only the first character line is kept, with its quantity", () => {
    const parsed = parseUvsUltraDeck("[b]Character[/b]\n2 First\n1 Second");
    expect(parsed.character).toEqual({ name: "First", quantity: 2 });
    expect(parsed.main).toEqual([]);
  });

  test("lines before any heading, without quantity, or with zero quantity are ignored", () => {
    const parsed = parseUvsUltraDeck(
      ["1 Orphan", "[b]Attack[/b]", "Jab", "0 Zero", "x2 Bad", "  2   Spaced Name  ", "3 Jab"].join("\n"),
    );
    expect(parsed.main).toEqual([
      { name: "Spaced Name", quantity: 2 },
      { name: "Jab", quantity: 3 },
    ]);
  });

  test("duplicate names are kept as separate entries", () => {
    const parsed = parseUvsUltraDeck("[b]Attack[/b]\n1 Jab\n[b]Action[/b]\n2 Jab");
    expect(parsed.main).toEqual([
      { name: "Jab", quantity: 1 },
      { name: "Jab", quantity: 2 },
    ]);
    expect(sumLineEntries(parsed.main)).toEqual({ Jab: 3 });
  });

  test("empty text", () => {
    expect(parseUvsUltraDeck("")).toEqual({ character: null, main: [], side: [] });
  });
});

describe("formatUvsUltraDeckExport", () => {
  test("groups main by type in fixed order, sorts by name, drops untyped entries", () => {
    const out = formatUvsUltraDeckExport({
      character: card("c", "Ryu"),
      main: [
        { name: "Zangief Punch", quantity: 2, type: "Attack" },
        { name: "Alpha Kick", quantity: 3, type: "Attack" },
        { name: "Training", quantity: 4, type: "Foundation" },
        { name: "Untyped", quantity: 1 },
      ],
      side: [
        { name: "Zed", quantity: 1 },
        { name: "Abe", quantity: 2 },
      ],
    });
    expect(out).toBe(
      [
        "[b]Character[/b]",
        "1 Ryu",
        "",
        "[b]Foundation[/b]",
        "4 Training",
        "",
        "[b]Attack[/b]",
        "3 Alpha Kick",
        "2 Zangief Punch",
        "",
        "[b]Asset[/b]",
        "",
        "[b]Action[/b]",
        "",
        "[b]Backup[/b]",
        "",
        "[b]Side[/b]",
        "2 Abe",
        "1 Zed",
      ].join("\n"),
    );
  });

  test("no character and empty lists", () => {
    const out = formatUvsUltraDeckExport({ character: null, main: [], side: [] });
    expect(out).toBe(
      [
        "[b]Character[/b]",
        "",
        "[b]Foundation[/b]",
        "",
        "[b]Attack[/b]",
        "",
        "[b]Asset[/b]",
        "",
        "[b]Action[/b]",
        "",
        "[b]Backup[/b]",
        "",
        "[b]Side[/b]",
      ].join("\n"),
    );
  });

  test("export -> parse round trip preserves character, typed main, and side", () => {
    const main = [
      { name: "Hadoken", quantity: 3, type: "Attack" as const },
      { name: "Gi", quantity: 1, type: "Asset" as const },
      { name: "Training", quantity: 4, type: "Foundation" as const },
    ];
    const side = [{ name: "Shoryuken", quantity: 2 }];
    const parsed = parseUvsUltraDeck(formatUvsUltraDeckExport({ character: card("c", "Ryu"), main, side }));
    expect(parsed.character).toEqual({ name: "Ryu", quantity: 1 });
    expect(parsed.main).toEqual([
      { name: "Training", quantity: 4 },
      { name: "Hadoken", quantity: 3 },
      { name: "Gi", quantity: 1 },
    ]);
    expect(parsed.side).toEqual(side);
  });
});

describe("card name index", () => {
  const ryu = card("r1", "Ryu");
  const ryuAlt = card("r2", "Ryu");
  const back = card("b1", "Back Face", { isFrontFace: false });
  const apostrophe = card("a1", "Chun-Li's Kick");
  const index = buildCardNameIndex([ryu, ryuAlt, back, apostrophe]);

  test("exact lookup is case/whitespace-insensitive and returns first match", () => {
    expect(findCardByName("  RYU ", index)).toBe(ryu);
  });

  test("normalized lookup strips apostrophes and punctuation", () => {
    expect(findCardByName("chun li’s kick", index)).toBe(apostrophe);
    expect(findCardByName("Chun Lis Kick!", index)).toBe(apostrophe);
  });

  test("back faces are excluded; unknown names return null", () => {
    expect(findCardByName("Back Face", index)).toBeNull();
    expect(findCardByName("Nope", index)).toBeNull();
    expect(index.exact.get("ryu")).toEqual([ryu, ryuAlt]);
  });
});

describe("count helpers", () => {
  test("incrementCount mutates and accumulates", () => {
    const record: Record<string, number> = {};
    incrementCount(record, "a", 2);
    incrementCount(record, "a", 3);
    incrementCount(record, "b", 1);
    expect(record).toEqual({ a: 5, b: 1 });
  });

  test("sumQuantities", () => {
    expect(sumQuantities({})).toBe(0);
    expect(sumQuantities({ a: 2, b: 3 })).toBe(5);
  });

  test("toCardId returns the _id", () => {
    expect(toCardId(card("xyz", "X"))).toBe("xyz" as Id<"cards">);
  });
});
