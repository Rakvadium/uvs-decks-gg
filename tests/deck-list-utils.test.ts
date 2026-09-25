import { describe, expect, test } from "bun:test";
import {
  LIST_SORT_SELECT_OPTIONS,
  LIST_VIEW_GROUPS,
  VIEW_MODE_OPTIONS,
  buildDeckEntriesFromQuantities,
  extractZones,
  getZoneTintClass,
  getZoneTone,
  sortListEntries,
  supportsListSortDirection,
  toSortedBuckets,
  type DeckListEntry,
} from "../src/components/deck-details/deck-list-utils";
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

function entry(c: CachedCard, typeKey = "Attack"): DeckListEntry {
  return { card: c, quantity: 1, typeKey };
}

function names(entries: DeckListEntry[]) {
  return entries.map((e) => e.card.name);
}

describe("constants", () => {
  test("list view groups", () => {
    expect(LIST_VIEW_GROUPS.map((g) => `${g.key}:${g.column}`)).toEqual([
      "Character:left",
      "Foundation:left",
      "Attack:right",
      "Action:right",
      "Asset:right",
      "Backup:right",
      "Other:right",
    ]);
  });

  test("sort select options expand directional keys", () => {
    expect(LIST_SORT_SELECT_OPTIONS.map((o) => o.value)).toEqual([
      "difficulty:asc",
      "difficulty:desc",
      "control:asc",
      "control:desc",
      "blockModifier:asc",
      "blockModifier:desc",
      "attackSpeed:asc",
      "attackSpeed:desc",
      "attackDamage:asc",
      "attackDamage:desc",
      "blockZone:asc",
      "attackZone:asc",
    ]);
    expect(LIST_SORT_SELECT_OPTIONS[0]?.label).toBe("Difficulty (Low to High)");
    expect(LIST_SORT_SELECT_OPTIONS[1]?.label).toBe("Difficulty (High to Low)");
    expect(LIST_SORT_SELECT_OPTIONS.at(-1)?.label).toBe("Attack Zone");
    expect(VIEW_MODE_OPTIONS.map((o) => o.value)).toEqual(["stacked", "list"]);
  });

  test("supportsListSortDirection", () => {
    expect(supportsListSortDirection("difficulty")).toBe(true);
    expect(supportsListSortDirection("blockZone")).toBe(false);
    expect(supportsListSortDirection("attackZone")).toBe(false);
  });
});

describe("extractZones", () => {
  test("empty input", () => {
    expect(extractZones(undefined)).toEqual([]);
    expect(extractZones(null)).toEqual([]);
    expect(extractZones("")).toEqual([]);
  });

  test("parses separators and dedupes, preserving first-seen order", () => {
    expect(extractZones("High")).toEqual(["High"]);
    expect(extractZones("mid, low")).toEqual(["Mid", "Low"]);
    expect(extractZones("L/M|H h")).toEqual(["Low", "Mid", "High"]);
    expect(extractZones("xyz")).toEqual([]);
  });
});

describe("zone tone", () => {
  test("getZoneTone uses first letter", () => {
    expect(getZoneTone("Low")).toBe("low");
    expect(getZoneTone("mid")).toBe("mid");
    expect(getZoneTone("HIGH")).toBe("high");
    expect(getZoneTone("x")).toBeNull();
    expect(getZoneTone(undefined)).toBeNull();
  });

  test("getZoneTintClass", () => {
    expect(getZoneTintClass("low")).toBe("bg-yellow-500/10");
    expect(getZoneTintClass("mid")).toBe("bg-orange-500/10");
    expect(getZoneTintClass("high")).toBe("bg-red-500/10");
    expect(getZoneTintClass(null)).toBe("");
  });
});

describe("buildDeckEntriesFromQuantities", () => {
  test("skips non-positive quantities and unknown cards, preserving key order", () => {
    const a = card("a", "A");
    const b = card("b", "B");
    const map = new Map([
      ["a", a],
      ["b", b],
    ]);
    expect(buildDeckEntriesFromQuantities({ b: 2, missing: 3, a: 1, z: 0 }, map)).toEqual([
      { card: b, quantity: 2 },
      { card: a, quantity: 1 },
    ]);
    expect(buildDeckEntriesFromQuantities({ a: -1 }, map)).toEqual([]);
  });
});

describe("toSortedBuckets", () => {
  test("sorts by value desc, stable for ties", () => {
    expect(toSortedBuckets({ a: 1, b: 3, c: 1 })).toEqual([
      { label: "b", value: 3 },
      { label: "a", value: 1 },
      { label: "c", value: 1 },
    ]);
  });
});

describe("sortListEntries", () => {
  const d1 = card("1", "bravo", { difficulty: 1, control: 5, blockModifier: 2, speed: 5, damage: 3, blockZone: "High", attackZone: "Low" });
  const d3 = card("2", "Alpha", { difficulty: 3, control: 3, blockModifier: 4, speed: 3, damage: 6, blockZone: "Low", attackZone: "High" });
  const d3b = card("3", "charlie", { difficulty: 3, control: 3, blockZone: "mid", attackZone: "Mid" });
  const none = card("4", "Delta", {});
  const list = [none, d3b, d3, d1].map((c) => entry(c));

  test("does not mutate input", () => {
    const copy = [...list];
    sortListEntries(list, "difficulty", "asc", "Attack");
    expect(list).toEqual(copy);
  });

  test("difficulty asc/desc, missing last, ties alphabetical (case-insensitive)", () => {
    expect(names(sortListEntries(list, "difficulty", "asc", "Attack"))).toEqual(["bravo", "Alpha", "charlie", "Delta"]);
    expect(names(sortListEntries(list, "difficulty", "desc", "Attack"))).toEqual(["Alpha", "charlie", "bravo", "Delta"]);
  });

  test("control sorts then falls back to difficulty asc, then name", () => {
    expect(names(sortListEntries(list, "control", "asc", "Attack"))).toEqual(["Alpha", "charlie", "bravo", "Delta"]);
    expect(names(sortListEntries(list, "control", "desc", "Attack"))).toEqual(["bravo", "Alpha", "charlie", "Delta"]);
  });

  test("blockModifier", () => {
    expect(names(sortListEntries(list, "blockModifier", "desc", "Attack"))).toEqual(["Alpha", "bravo", "charlie", "Delta"]);
  });

  test("attackSpeed / attackDamage apply only to the Attack group", () => {
    expect(names(sortListEntries(list, "attackSpeed", "asc", "Attack"))).toEqual(["Alpha", "bravo", "charlie", "Delta"]);
    expect(names(sortListEntries(list, "attackDamage", "desc", "Attack"))).toEqual(["Alpha", "bravo", "charlie", "Delta"]);
    // Non-attack groups fall back to difficulty then name.
    expect(names(sortListEntries(list, "attackSpeed", "asc", "Action"))).toEqual(["bravo", "Alpha", "charlie", "Delta"]);
    expect(names(sortListEntries(list, "attackDamage", "desc", "Action"))).toEqual(["bravo", "Alpha", "charlie", "Delta"]);
  });

  test("zones sort Low < Mid < High, ignore direction, missing last", () => {
    expect(names(sortListEntries(list, "blockZone", "desc", "Foundation"))).toEqual(["Alpha", "charlie", "bravo", "Delta"]);
    expect(names(sortListEntries(list, "attackZone", "asc", "Attack"))).toEqual(["bravo", "charlie", "Alpha", "Delta"]);
    expect(names(sortListEntries(list, "attackZone", "asc", "Asset"))).toEqual(["bravo", "Alpha", "charlie", "Delta"]);
  });
});
