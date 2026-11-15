import { describe, expect, test } from "bun:test";
import { deriveCardSearchFields } from "../convex/lib/cardCreate";
import {
  applyCatalogSearchFields,
  withoutCatalogSearchFields,
} from "../src/lib/universus/catalog-search-fields";
import type { CachedCard } from "../src/lib/universus/card-store";

function card(fields: Partial<CachedCard>): CachedCard {
  return { _id: "id1", _creationTime: 0, name: "Card", ...fields } as CachedCard;
}

describe("applyCatalogSearchFields", () => {
  test("UniVersus: searchText is lowercased keywords and text with pipes as spaces, without the name", () => {
    const c = card({
      name: "Kings Games",
      keywords: "Terrain|Unique",
      text: "At the beginning of each player's Combat Phase|E: Draw 1 card.",
      setName: "Attack on Titan",
      type: "Asset",
      rarity: "Rare",
    });
    applyCatalogSearchFields([c], "uvs");
    expect(c.searchText).toBe(
      "terrain unique at the beginning of each player's combat phase e: draw 1 card."
    );
    expect(c.searchAll).toBe(`kings games ${c.searchText} attack on titan asset rare`);
  });

  test("UniVersus: a card without keywords keeps the leading space of the stored format", () => {
    const c = card({ name: "Bleeding Internally", text: "Only your opponent may play this." });
    applyCatalogSearchFields([c], "uvs");
    expect(c.searchText).toBe(" only your opponent may play this.");
    expect(c.searchAll).toBe("bleeding internally  only your opponent may play this.   ");
  });

  test("other games match the backend's deriveCardSearchFields, lowercased", () => {
    const fields = {
      name: "V: Streetkid",
      subname: "Streetkid",
      tags: "Merc|Solo",
      keywords: "",
      text: "{Call} Trash 3.",
      setName: "Alpha",
      type: "Legend",
      rarity: "Rare",
      color: "Red",
    };
    const c = card(fields);
    applyCatalogSearchFields([c], "cyberpunk");
    const expected = deriveCardSearchFields(fields);
    expect(c.searchText).toBe(expected.searchText.toLowerCase());
    expect(c.searchAll).toBe(expected.searchAll.toLowerCase());
  });

  test("replaces stored values", () => {
    const c = card({ text: "Fresh text", searchText: "stale", searchAll: "stale" });
    applyCatalogSearchFields([c], "uvs");
    expect(c.searchText).toBe(" fresh text");
  });
});

describe("withoutCatalogSearchFields", () => {
  test("drops only the rebuilt fields and leaves the originals untouched", () => {
    const c = card({ text: "x", searchName: "card", searchText: "a", searchAll: "b" });
    const [stripped] = withoutCatalogSearchFields([c]);
    expect(stripped).not.toHaveProperty("searchText");
    expect(stripped).not.toHaveProperty("searchAll");
    expect(stripped.searchName).toBe("card");
    expect(c.searchText).toBe("a");
  });
});
