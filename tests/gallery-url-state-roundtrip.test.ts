import { describe, expect, test } from "bun:test";
import {
  fromGalleryViewMode,
  galleryUrlHasState,
  parseGalleryUrlState,
  stripSearchFields,
  toGalleryViewMode,
  writeGalleryUrlState,
} from "../src/lib/gallery/url-state";
import type { CardFilters } from "../src/providers/UIStateProvider";

const baseState = {
  search: "",
  searchMode: "all" as const,
  viewMode: "card" as const,
  sortField: "default",
  sortDirection: "asc" as const,
  defaultFormatKey: "standard",
};

function roundTrip(filters: CardFilters) {
  const written = writeGalleryUrlState(new URLSearchParams(), { ...baseState, filters });
  return { written, parsed: parseGalleryUrlState(written) };
}

describe("gallery url state: every filter key round-trips", () => {
  const arrayKeys = ["rarity", "type", "set", "symbols", "attuned", "keywords", "attackZone", "blockZone", "abilityTiming"] as const;
  for (const key of arrayKeys) {
    test(`array ${key}`, () => {
      const { written, parsed } = roundTrip({ [key]: ["A b", "C"] });
      expect(written.get(key)).toBe("A b,C");
      expect(parsed.filters?.[key]).toEqual(["A b", "C"]);
    });
  }

  const boolKeys = [
    "symbolMatchAll",
    "keywordMatchAll",
    "includeBanned",
    "hasAttack",
    "hasBlock",
    "isCharacter",
    "hasAbilities",
    "isDualFaced",
    "isReleased",
  ] as const;
  for (const key of boolKeys) {
    test(`bool ${key}: true written as 1, false omitted`, () => {
      const t = roundTrip({ [key]: true });
      expect(t.written.get(key)).toBe("1");
      expect(t.parsed.filters?.[key]).toBe(true);
      const f = roundTrip({ [key]: false });
      expect(f.written.has(key)).toBe(false);
      expect(f.parsed.filters).toBeUndefined();
    });
  }

  test("includeInfinity: false written as 0, true omitted", () => {
    expect(roundTrip({ includeInfinity: false }).written.get("includeInfinity")).toBe("0");
    expect(roundTrip({ includeInfinity: false }).parsed.filters?.includeInfinity).toBe(false);
    expect(roundTrip({ includeInfinity: true }).written.has("includeInfinity")).toBe(false);
  });

  const numberKeys = [
    "difficultyMin",
    "difficultyMax",
    "controlMin",
    "controlMax",
    "speedMin",
    "speedMax",
    "damageMin",
    "damageMax",
    "blockModifierMin",
    "blockModifierMax",
    "handSizeMin",
    "handSizeMax",
    "healthMin",
    "healthMax",
    "staminaMin",
    "staminaMax",
  ] as const;
  for (const key of numberKeys) {
    test(`number ${key}`, () => {
      const { written, parsed } = roundTrip({ [key]: 0 });
      expect(written.get(key)).toBe("0");
      expect(parsed.filters?.[key]).toBe(0);
      expect(roundTrip({ [key]: -1.5 }).parsed.filters?.[key]).toBe(-1.5);
    });
  }

  const statKeys = ["difficulty", "control", "speed", "damage", "blockModifier", "handSize", "health", "stamina"] as const;
  const operators = ["eq", "neq", "gt", "lt", "gte", "lte"] as const;
  for (const key of statKeys) {
    test(`stat ${key} with every operator`, () => {
      for (const operator of operators) {
        const { written, parsed } = roundTrip({ [key]: { operator, value: 4 } });
        expect(written.get(key)).toBe(`${operator}:4`);
        expect(parsed.filters?.[key]).toEqual({ operator, value: 4 });
      }
    });
  }

  test("all keys together survive a round trip", () => {
    const filters: CardFilters = {
      format: "expanded",
      rarity: ["Rare"],
      type: ["Attack"],
      set: ["s1"],
      symbols: ["fire"],
      attuned: ["water"],
      keywords: ["Flash"],
      attackZone: ["High"],
      blockZone: ["Low"],
      abilityTiming: ["Enhance"],
      symbolMatchAll: true,
      keywordMatchAll: true,
      includeInfinity: false,
      includeBanned: true,
      hasAttack: true,
      hasBlock: true,
      isCharacter: true,
      hasAbilities: true,
      isDualFaced: true,
      isReleased: true,
      difficultyMin: 1,
      difficultyMax: 2,
      controlMin: 3,
      controlMax: 4,
      speedMin: 5,
      speedMax: 6,
      damageMin: 7,
      damageMax: 8,
      blockModifierMin: 9,
      blockModifierMax: 10,
      handSizeMin: 11,
      handSizeMax: 12,
      healthMin: 13,
      healthMax: 14,
      staminaMin: 15,
      staminaMax: 16,
      difficulty: { operator: "eq", value: 1 },
      control: { operator: "neq", value: 2 },
      speed: { operator: "gt", value: 3 },
      damage: { operator: "lt", value: 4 },
      blockModifier: { operator: "gte", value: 5 },
      handSize: { operator: "lte", value: 6 },
      health: { operator: "eq", value: 7 },
      stamina: { operator: "eq", value: 8 },
    };
    expect(roundTrip(filters).parsed.filters).toEqual(filters);
  });
});

describe("gallery url state: write details", () => {
  test("search is trimmed; non-default mode/view/sort written", () => {
    const written = writeGalleryUrlState(new URLSearchParams(), {
      ...baseState,
      search: "  ryu  ",
      searchMode: "text",
      viewMode: "details",
      sortField: "difficulty",
      sortDirection: "desc",
      filters: {},
    });
    expect(written.toString()).toBe("q=ryu&sm=text&view=details&sort=difficulty&dir=desc");
  });

  test("format equal to default is omitted; without default it is written", () => {
    expect(roundTrip({ format: "standard" }).written.has("format")).toBe(false);
    const written = writeGalleryUrlState(new URLSearchParams(), {
      search: "",
      searchMode: "all",
      viewMode: "card",
      filters: { format: "standard" },
    });
    expect(written.get("format")).toBe("standard");
  });

  test("empty arrays are omitted; search/searchMode inside filters are not written", () => {
    const { written } = roundTrip({ type: [], search: "x", searchMode: "text" });
    expect(written.toString()).toBe("");
  });

  test("preserves unrelated params and clears stale gallery params", () => {
    const written = writeGalleryUrlState(new URLSearchParams("keep=1&type=Old&difficulty=eq:1"), {
      ...baseState,
      filters: {},
    });
    expect(written.toString()).toBe("keep=1");
  });
});

describe("gallery url state: parse details", () => {
  test("grid view alias maps to card; invalid values are dropped", () => {
    expect(parseGalleryUrlState(new URLSearchParams("view=grid")).viewMode).toBe("card");
    const parsed = parseGalleryUrlState(new URLSearchParams("view=tiles&sm=fuzzy&dir=up"));
    expect(parsed).toEqual({});
  });

  test("empty q is kept as empty string", () => {
    expect(parseGalleryUrlState(new URLSearchParams("q=")).search).toBe("");
  });

  test("csv trims and drops empties", () => {
    expect(parseGalleryUrlState(new URLSearchParams("type= A , ,B")).filters?.type).toEqual(["A", "B"]);
    expect(parseGalleryUrlState(new URLSearchParams("type=,,")).filters).toBeUndefined();
  });

  test("bools accept 1/true/0/false only", () => {
    const parsed = parseGalleryUrlState(new URLSearchParams("hasAttack=true&hasBlock=0&isCharacter=yes"));
    expect(parsed.filters).toEqual({ hasAttack: true, hasBlock: false });
  });

  test("numbers reject empty and non-finite", () => {
    const parsed = parseGalleryUrlState(new URLSearchParams("difficultyMin=&controlMin=abc&speedMin=Infinity&damageMin=2"));
    expect(parsed.filters).toEqual({ damageMin: 2 });
  });

  test("stats reject bad operators/amounts; extra segments are ignored", () => {
    const parsed = parseGalleryUrlState(
      new URLSearchParams("difficulty=foo:1&control=eq:&speed=eq:x&damage=gte&health=lt:3:9"),
    );
    expect(parsed.filters).toEqual({ health: { operator: "lt", value: 3 } });
  });

  test("galleryUrlHasState only reacts to gallery keys", () => {
    expect(galleryUrlHasState(new URLSearchParams("foo=1"))).toBe(false);
    expect(galleryUrlHasState(new URLSearchParams("stamina=eq:1"))).toBe(true);
    expect(galleryUrlHasState(new URLSearchParams("format="))).toBe(true);
  });
});

describe("view mode + search helpers", () => {
  test("toGalleryViewMode / fromGalleryViewMode", () => {
    expect(toGalleryViewMode("card")).toBe("grid");
    expect(toGalleryViewMode("list")).toBe("list");
    expect(toGalleryViewMode("details")).toBe("details");
    expect(fromGalleryViewMode("grid")).toBe("card");
    expect(fromGalleryViewMode(undefined)).toBe("card");
    expect(fromGalleryViewMode("details")).toBe("details");
  });

  test("stripSearchFields removes search keys without mutating input", () => {
    const input: CardFilters = { search: "x", searchMode: "text", type: ["A"] };
    expect(stripSearchFields(input)).toEqual({ type: ["A"] });
    expect(input.search).toBe("x");
  });
});
