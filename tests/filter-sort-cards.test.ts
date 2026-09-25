import { describe, expect, test } from "bun:test";
import { UVS_FILTER_DEFINITION } from "../shared/games/uvs/filters";
import { filterCards, paginateCards, sortCards } from "../src/lib/universus/use-universus-cards";
import type { CachedCard } from "../src/lib/universus/card-store";
import type { CardFilters, StatFilterValue } from "../src/providers/UIStateProvider";
import type { Id } from "../convex/_generated/dataModel";

function card(id: string, extra: Partial<CachedCard> = {}): CachedCard {
  return {
    _id: id as Id<"cards">,
    _creationTime: 0,
    name: id,
    isFrontFace: true,
    isVariant: false,
    setCode: "s1",
    ...extra,
  } as CachedCard;
}

function ids(cards: CachedCard[]) {
  return cards.map((c) => c._id as string);
}

function run(cards: CachedCard[], filters: CardFilters) {
  return ids(filterCards(cards, filters, undefined, UVS_FILTER_DEFINITION));
}

describe("filterCards basics", () => {
  test("empty filters return all gallery cards, excluding back faces and variants", () => {
    const cards = [card("a"), card("back", { isFrontFace: false }), card("var", { isVariant: true }), card("b")];
    expect(run(cards, {})).toEqual(["a", "b"]);
  });

  test("returns a new array", () => {
    const cards = [card("a")];
    expect(filterCards(cards, {}, undefined, UVS_FILTER_DEFINITION)).not.toBe(cards);
  });
});

describe("text search", () => {
  const cards = [
    card("n", { name: "Fireball" }),
    card("sn", { name: "X", searchName: "alt fireball" }),
    card("t", { name: "Y", text: "Deal FIRE damage" }),
    card("st", { name: "Z", searchText: "fire text" }),
    card("sa", { name: "W", searchAll: "fire everywhere" }),
  ];

  test("default mode is name (name + searchName)", () => {
    expect(run(cards, { search: "FIRE" })).toEqual(["n", "sn"]);
  });

  test("text mode (text + searchText)", () => {
    expect(run(cards, { search: "fire", searchMode: "text" })).toEqual(["t", "st"]);
  });

  test("all mode includes searchAll", () => {
    expect(run(cards, { search: "fire", searchMode: "all" })).toEqual(["n", "sn", "t", "st", "sa"]);
  });

  test("whitespace-only search is ignored; non-empty search is not trimmed", () => {
    expect(run(cards, { search: "   " })).toHaveLength(5);
    expect(run([card("a", { name: "Fire ball" }), card("b", { name: "Fireball" })], { search: "fire " })).toEqual(["a"]);
  });
});

describe("format options", () => {
  test("passesFormatLegality filters by setCode", () => {
    const cards = [card("a", { setCode: "old" }), card("b", { setCode: "new" })];
    const out = filterCards(cards, {}, { passesFormatLegality: (s) => s === "new" }, UVS_FILTER_DEFINITION);
    expect(ids(out)).toEqual(["b"]);
  });

  test("bans apply regardless of filters.format; includeBanned disables", () => {
    const cards = [card("a"), card("banned")];
    const isCardBannedInFormat = (id: string) => id === "banned";
    expect(ids(filterCards(cards, {}, { isCardBannedInFormat }, UVS_FILTER_DEFINITION))).toEqual(["a"]);
    expect(ids(filterCards(cards, { includeBanned: true }, { isCardBannedInFormat }, UVS_FILTER_DEFINITION))).toEqual(["a", "banned"]);
    expect(ids(filterCards(cards, { includeBanned: true }, undefined, UVS_FILTER_DEFINITION))).toEqual(["a", "banned"]);
  });
});

describe("type / rarity / set", () => {
  const cards = [
    card("atk", { type: "Attack", rarity: "C", setCode: "s1" }),
    card("fnd", { type: "Foundation", rarity: "Uncommon", setCode: "s2" }),
    card("none"),
  ];

  test("type is exact, case-sensitive", () => {
    expect(run(cards, { type: ["Attack"] })).toEqual(["atk"]);
    expect(run(cards, { type: ["attack"] })).toEqual([]);
    expect(run(cards, { type: [] })).toHaveLength(3);
  });

  test("rarity uses canonical aliases", () => {
    expect(run(cards, { rarity: ["Common"] })).toEqual(["atk"]);
    expect(run(cards, { rarity: ["UC"] })).toEqual(["fnd"]);
  });

  test("set", () => {
    // "none" uses the helper default setCode "s1".
    expect(run(cards, { set: ["s2", "s1"] })).toEqual(["atk", "fnd", "none"]);
    expect(run(cards, { set: ["s2"] })).toEqual(["fnd"]);
    expect(run([card("nos", { setCode: undefined })], { set: ["s1"] })).toEqual([]);
    expect(run(cards, { set: ["zz"] })).toEqual([]);
  });

  test("isCharacter filter is not applied by filterCards", () => {
    const withChar = [card("c", { type: "Character" }), card("a", { type: "Attack" })];
    expect(run(withChar, { isCharacter: true })).toEqual(["c", "a"]);
  });
});

describe("symbols", () => {
  const cards = [
    card("fire", { symbols: "Fire" }),
    card("fw", { symbols: "fire|water" }),
    card("water", { symbols: "water" }),
    card("inf", { symbols: "Infinity" }),
    card("att", { symbols: "attuned:fire" }),
    card("none"),
  ];

  test("any-match includes infinity cards by default; no-symbol cards excluded", () => {
    expect(run(cards, { symbols: ["fire"] })).toEqual(["fire", "fw", "inf", "att"]);
  });

  test("includeInfinity false excludes infinity and symbol-less cards even without symbol filter", () => {
    expect(run(cards, { includeInfinity: false })).toEqual(["fire", "fw", "water", "att"]);
    expect(run(cards, { symbols: ["fire"], includeInfinity: false })).toEqual(["fire", "fw", "att"]);
  });

  test("matchAll requires every symbol", () => {
    expect(run(cards, { symbols: ["fire", "water"], symbolMatchAll: true })).toEqual(["fw", "inf"]);
  });

  test("'infinity' in the symbol filter is dropped", () => {
    expect(run(cards, { symbols: ["infinity"] })).toHaveLength(6);
  });

  test("attuned filter matches attuned tokens literally and disables stripping", () => {
    expect(run(cards, { symbols: ["attuned:fire"] })).toEqual(["inf", "att"]);
  });

  test("attuned tokens are not stripped in matchAll mode", () => {
    expect(run(cards, { symbols: ["fire"], symbolMatchAll: true, includeInfinity: false })).toEqual(["fire", "fw"]);
  });
});

describe("keywords", () => {
  const cards = [
    card("a", { keywords: "Breaker: 2|Flash" }),
    card("b", { keywords: "Flash" }),
    card("c"),
  ];

  test("any vs all, supports 'Keyword: value' prefix", () => {
    expect(run(cards, { keywords: ["Breaker", "Flash"] })).toEqual(["a", "b"]);
    expect(run(cards, { keywords: ["Breaker", "Flash"], keywordMatchAll: true })).toEqual(["a"]);
    expect(run(cards, { keywords: ["flash"] })).toEqual([]);
  });
});

describe("min/max ranges", () => {
  const cards = [
    card("lo", { difficulty: 1, control: 2, speed: 3, damage: 1 }),
    card("mid", { difficulty: 3, control: 4, speed: 5, damage: 4 }),
    card("hi", { difficulty: 6, control: 6, speed: 8, damage: 7 }),
    card("none"),
  ];

  test("difficulty/control/speed/damage inclusive bounds and missing values excluded", () => {
    expect(run(cards, { difficultyMin: 3 })).toEqual(["mid", "hi"]);
    expect(run(cards, { difficultyMax: 3 })).toEqual(["lo", "mid"]);
    expect(run(cards, { controlMin: 3, controlMax: 5 })).toEqual(["mid"]);
    expect(run(cards, { speedMin: 5 })).toEqual(["mid", "hi"]);
    expect(run(cards, { damageMax: 4 })).toEqual(["lo", "mid"]);
  });

  test("health/handSize/stamina/blockModifier min/max keys are NOT applied by filterCards", () => {
    const withStats = [card("x", { health: 20, handSize: 7, stamina: 5, blockModifier: 2 }), card("y")];
    expect(
      run(withStats, {
        healthMin: 100,
        healthMax: 0,
        handSizeMin: 100,
        handSizeMax: 0,
        staminaMin: 100,
        staminaMax: 0,
        blockModifierMin: 100,
        blockModifierMax: 0,
      }),
    ).toEqual(["x", "y"]);
  });
});

describe("operator stat filters", () => {
  const stats = ["difficulty", "control", "health", "handSize", "stamina", "blockModifier", "speed", "damage"] as const;
  const cards = [1, 3, 5].map((v) => card(`v${v}`, Object.fromEntries(stats.map((s) => [s, v])) as Partial<CachedCard>));
  cards.push(card("none"));

  const cases: [StatFilterValue, string[]][] = [
    [{ operator: "eq", value: 3 }, ["v3"]],
    [{ operator: "neq", value: 3 }, ["v1", "v5"]],
    [{ operator: "gt", value: 3 }, ["v5"]],
    [{ operator: "lt", value: 3 }, ["v1"]],
    [{ operator: "gte", value: 3 }, ["v3", "v5"]],
    [{ operator: "lte", value: 3 }, ["v1", "v3"]],
  ];

  for (const stat of stats) {
    for (const [filter, expected] of cases) {
      test(`${stat} ${filter.operator} ${filter.value}`, () => {
        expect(run(cards, { [stat]: filter })).toEqual(expected);
      });
    }
  }

  test("unknown operator passes cards with a value but still excludes missing values", () => {
    expect(run(cards, { difficulty: { operator: "bogus" as StatFilterValue["operator"], value: 3 } })).toEqual([
      "v1",
      "v3",
      "v5",
    ]);
  });
});

describe("zones", () => {
  const cards = [
    card("h", { attackZone: "High", blockZone: "Mid" }),
    card("m", { attackZone: "mid", blockZone: "Low" }),
    card("l", { attackZone: "Low", blockZone: "High" }),
    card("none"),
  ];

  test("attack and block zone are case-insensitive exact matches", () => {
    expect(run(cards, { attackZone: ["high", "Mid"] })).toEqual(["h", "m"]);
    expect(run(cards, { blockZone: ["LOW"] })).toEqual(["m"]);
    expect(run(cards, { attackZone: ["High"], blockZone: ["Mid"] })).toEqual(["h"]);
    expect(run(cards, { attackZone: [] })).toHaveLength(4);
  });
});

describe("sortCards", () => {
  const a = card("a", { name: "Bravo", type: "Attack", rarity: "R", setCode: "b", setNumber: 1, collectorNumber: "10", difficulty: 3, control: 1, speed: 2, damage: 9 });
  const b = card("b", { name: "alpha", type: "Action", rarity: "C", setCode: "a", setNumber: 2, collectorNumber: "2", difficulty: 1, control: 5 });
  const c = card("c", { name: "Charlie", setNumber: 2, collectorNumber: "1", difficulty: 2, speed: 4, damage: 1 });

  test("empty and single inputs", () => {
    expect(sortCards([], { field: "name", direction: "asc" }, UVS_FILTER_DEFINITION)).toEqual([]);
    const single = [a];
    const out = sortCards(single, { field: "name", direction: "asc" }, UVS_FILTER_DEFINITION);
    expect(out).toEqual([a]);
    expect(out).not.toBe(single);
  });

  test("default: setNumber desc, then collectorNumber asc (numeric)", () => {
    expect(ids(sortCards([a, b, c], { field: "default", direction: "desc" }, UVS_FILTER_DEFINITION))).toEqual(["c", "b", "a"]);
    expect(ids(sortCards([a, b, c], { field: "unknown", direction: "desc" }, UVS_FILTER_DEFINITION))).toEqual(["c", "b", "a"]);
  });

  test.each([
    ["name", "asc", ["b", "a", "c"]],
    ["name", "desc", ["c", "a", "b"]],
    ["type", "asc", ["c", "b", "a"]],
    ["rarity", "asc", ["c", "b", "a"]],
    ["setCode", "asc", ["b", "a", "c"]],
    ["set", "desc", ["c", "a", "b"]],
    ["setNumber", "asc", ["a", "b", "c"]],
    ["collectorNumber", "asc", ["c", "b", "a"]],
    ["difficulty", "asc", ["b", "c", "a"]],
    ["control", "desc", ["b", "a", "c"]],
    ["speed", "asc", ["b", "a", "c"]],
    ["damage", "desc", ["a", "c", "b"]],
  ] as const)("%s %s", (field, direction, expected) => {
    expect(ids(sortCards([a, b, c], { field, direction }, UVS_FILTER_DEFINITION))).toEqual([...expected]);
  });
});

describe("paginateCards", () => {
  test("slices and reports pages", () => {
    const cards = ["a", "b", "c", "d", "e"].map((id) => card(id));
    expect(paginateCards(cards, 0, 2)).toEqual({ cards: cards.slice(0, 2), totalPages: 3, hasMore: true });
    expect(paginateCards(cards, 2, 2)).toEqual({ cards: cards.slice(4), totalPages: 3, hasMore: false });
  });
});
