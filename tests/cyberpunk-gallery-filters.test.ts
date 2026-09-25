import { describe, expect, test } from "bun:test";
import { CYBERPUNK_FILTER_DEFINITION } from "../shared/games/cyberpunk/filters";
import { UVS_FILTER_DEFINITION } from "../shared/games/uvs/filters";
import { UVS_KEYWORD_LIST } from "../shared/games/uvs/keywords";
import { compileFacetFilter, splitPipeList } from "../shared/games/filters";
import { filterCards, sortCards } from "../src/lib/universus/use-universus-cards";
import { getUniqueValues, type CachedCard } from "../src/lib/universus/card-store";
import { galleryUrlHasState, parseGalleryUrlState, writeGalleryUrlState } from "../src/lib/gallery/url-state";
import type { CardFilters } from "../src/providers/UIStateProvider";
import type { Id } from "../convex/_generated/dataModel";

const DEF = CYBERPUNK_FILTER_DEFINITION;

function card(id: string, extra: Partial<CachedCard> = {}): CachedCard {
  return {
    _id: id as Id<"cards">,
    _creationTime: 0,
    name: id,
    isFrontFace: true,
    isVariant: false,
    setCode: "WTNC",
    ...extra,
  } as CachedCard;
}

const ids = (cards: CachedCard[]) => cards.map((c) => c._id as string);
const run = (cards: CachedCard[], filters: CardFilters) => ids(filterCards(cards, filters, undefined, DEF));

const CARDS = [
  card("v", { type: "Legend", color: "red", cost: 5, power: 6, ram: 2, tags: "Merc" }),
  card("jackie", { type: "Unit", color: "Red", cost: 3, power: 4, ram: 1, tags: "Merc|Valentinos" }),
  card("judy", { type: "Unit", color: "blue", cost: 2, power: 2, ram: 2, tags: "Mox|Braindance" }),
  card("mantis", { type: "Gear", color: "green", cost: 1, ram: 0, tags: "cyberware" }),
  card("colorless", { type: "Program", cost: 0 }),
];

describe("cyberpunk filterCards: colors", () => {
  test("matches any selected color, case-insensitively; colorless cards drop out", () => {
    expect(run(CARDS, { colors: ["red"] })).toEqual(["v", "jackie"]);
    expect(run(CARDS, { colors: ["blue", "green"] })).toEqual(["judy", "mantis"]);
    expect(run(CARDS, { colors: ["RED"] })).toEqual(["v", "jackie"]);
  });

  test("empty selection is no filter", () => {
    expect(run(CARDS, { colors: [] })).toHaveLength(CARDS.length);
  });
});

describe("cyberpunk filterCards: tags", () => {
  test("matches any selected tag in the pipe list, case-insensitively", () => {
    expect(run(CARDS, { tags: ["Merc"] })).toEqual(["v", "jackie"]);
    expect(run(CARDS, { tags: ["braindance", "Cyberware"] })).toEqual(["judy", "mantis"]);
  });

  test("combines with colors (AND)", () => {
    expect(run(CARDS, { tags: ["Merc"], colors: ["blue"] })).toEqual([]);
    expect(run(CARDS, { tags: ["Merc", "Mox"], colors: ["blue"] })).toEqual(["judy"]);
  });
});

describe("cyberpunk filterCards: cost / power / ram", () => {
  test("operator rules; a rule excludes cards missing the field", () => {
    expect(run(CARDS, { cost: { operator: "lte", value: 2 } })).toEqual(["judy", "mantis", "colorless"]);
    expect(run(CARDS, { power: { operator: "gte", value: 4 } })).toEqual(["v", "jackie"]);
    expect(run(CARDS, { ram: { operator: "eq", value: 2 } })).toEqual(["v", "judy"]);
    expect(run(CARDS, { power: { operator: "neq", value: 2 } })).toEqual(["v", "jackie"]);
  });

  test("min/max ranges", () => {
    expect(run(CARDS, { costMin: 1, costMax: 3 })).toEqual(["jackie", "judy", "mantis"]);
    expect(run(CARDS, { ramMax: 0 })).toEqual(["mantis"]);
    expect(run(CARDS, { powerMin: 5 })).toEqual(["v"]);
  });
});

describe("cyberpunk sortCards", () => {
  test("sorts by cost / power / ram (missing = 0)", () => {
    expect(ids(sortCards(CARDS, { field: "cost", direction: "asc" }, DEF))).toEqual([
      "colorless",
      "mantis",
      "judy",
      "jackie",
      "v",
    ]);
    expect(ids(sortCards(CARDS, { field: "power", direction: "desc" }, DEF)).slice(0, 2)).toEqual(["v", "jackie"]);
    expect(ids(sortCards(CARDS, { field: "ram", direction: "asc" }, DEF)).slice(0, 2)).toEqual(["mantis", "colorless"]);
  });
});

describe("facet filters are definition-gated", () => {
  test("UVS ignores colors/tags (no facet declared)", () => {
    expect(compileFacetFilter(UVS_FILTER_DEFINITION, { colors: ["red"], tags: ["Merc"] })).toBeNull();
    expect(ids(filterCards(CARDS, { colors: ["red"] }, undefined, UVS_FILTER_DEFINITION))).toHaveLength(CARDS.length);
  });

  test("splitPipeList trims and drops empties", () => {
    expect(splitPipeList(" A | B||C ")).toEqual(["A", "B", "C"]);
    expect(splitPipeList(undefined)).toEqual([]);
  });
});

describe("cyberpunk gallery url state", () => {
  const baseState = {
    search: "",
    searchMode: "all" as const,
    viewMode: "card" as const,
    sortField: "default",
    sortDirection: "asc" as const,
    defaultFormatKey: "standard",
  };

  test("colors, tags and cost/power/ram round-trip", () => {
    const filters: CardFilters = {
      colors: ["red", "blue"],
      tags: ["Merc", "Night City"],
      type: ["Unit"],
      cost: { operator: "lte", value: 3 },
      power: { operator: "gte", value: 2 },
      ram: { operator: "eq", value: 1 },
      costMin: 1,
      ramMax: 2,
    };
    const written = writeGalleryUrlState(new URLSearchParams(), { ...baseState, filters }, DEF);
    expect(written.get("colors")).toBe("red,blue");
    expect(written.get("tags")).toBe("Merc,Night City");
    expect(written.get("cost")).toBe("lte:3");
    expect(written.get("power")).toBe("gte:2");
    expect(written.get("ram")).toBe("eq:1");
    expect(written.get("costMin")).toBe("1");
    expect(written.get("ramMax")).toBe("2");
    expect(parseGalleryUrlState(written, DEF).filters).toEqual(filters);
    expect(galleryUrlHasState(new URLSearchParams("tags=Merc"), DEF)).toBe(true);
  });

  test("UVS urls don't know the Cyberpunk keys", () => {
    const params = new URLSearchParams("colors=red&tags=Merc&cost=lte:3");
    expect(galleryUrlHasState(params, UVS_FILTER_DEFINITION)).toBe(false);
    expect(parseGalleryUrlState(params, UVS_FILTER_DEFINITION).filters).toBeUndefined();
    const written = writeGalleryUrlState(
      new URLSearchParams(),
      { ...baseState, filters: { colors: ["red"], tags: ["Merc"] } },
      UVS_FILTER_DEFINITION
    );
    expect(written.toString()).toBe("");
  });
});

describe("getUniqueValues", () => {
  test("cyberpunk: tags + colors from the catalog; keywords derived (no fixed list)", () => {
    const values = getUniqueValues(
      [
        ...CARDS,
        card("kw", { type: "Unit", color: "Yellow", keywords: "Blocker|Quick: 2", tags: "merc" }),
      ],
      DEF
    );
    expect(values.colors).toEqual(["blue", "green", "red", "yellow"]);
    expect(values.tags).toEqual(["Braindance", "cyberware", "Merc", "Mox", "Valentinos"]);
    expect(values.keywords).toEqual(["Blocker", "Quick"]);
    expect(values.types).toEqual(["Gear", "Legend", "Program", "Unit"]);
  });

  test("UVS keeps its curated keyword list", () => {
    expect(getUniqueValues([card("a", { keywords: "Zzz" })], UVS_FILTER_DEFINITION).keywords).toEqual([
      ...UVS_KEYWORD_LIST,
    ]);
    expect(getUniqueValues([card("a")]).keywords).toEqual([...UVS_KEYWORD_LIST]);
  });
});
