import { describe, expect, test } from "bun:test";
import {
  canonicalizeRarity,
  cardMatchesRarityFilter,
  dedupeRarityOptions,
  rarityFilterSelected,
  toggleCanonicalRarityFilter,
} from "../src/lib/universus/rarity";

describe("rarity normalize", () => {
  test("maps abbreviations and full words to one canonical label", () => {
    expect(canonicalizeRarity("C")).toBe("Common");
    expect(canonicalizeRarity("COMMON")).toBe("Common");
    expect(canonicalizeRarity("common")).toBe("Common");
    expect(canonicalizeRarity("UC")).toBe("Uncommon");
    expect(canonicalizeRarity("UNCOMMON")).toBe("Uncommon");
    expect(canonicalizeRarity("R")).toBe("Rare");
    expect(canonicalizeRarity("RARE")).toBe("Rare");
    expect(canonicalizeRarity("SR")).toBe("Super Rare");
    expect(canonicalizeRarity("UR")).toBe("Ultra Rare");
    expect(canonicalizeRarity("ULTRA")).toBe("Ultra Rare");
    expect(canonicalizeRarity("SE")).toBe("Secret Rare");
    expect(canonicalizeRarity("SECRET")).toBe("Secret Rare");
    expect(canonicalizeRarity("PROMO")).toBe("Promo");
  });

  test("drops type leakage from rarity options", () => {
    expect(canonicalizeRarity("CHARACTER")).toBeNull();
    expect(canonicalizeRarity("Token")).toBeNull();
    expect(canonicalizeRarity("Special")).toBeNull();
  });

  test("dedupes overlapping rarity values from the gallery facet set", () => {
    expect(
      dedupeRarityOptions([
        "C",
        "CHARACTER",
        "COMMON",
        "PROMO",
        "R",
        "RARE",
        "SE",
        "SR",
        "SECRET",
        "TOKEN",
        "UC",
        "UR",
        "ULTRA",
        "UNCOMMON",
      ])
    ).toEqual([
      "Common",
      "Promo",
      "Rare",
      "Secret Rare",
      "Super Rare",
      "Ultra Rare",
      "Uncommon",
    ]);
  });

  test("dedupes live catalog rarity mix", () => {
    expect(
      dedupeRarityOptions([
        "C",
        "Character",
        "Common",
        "Promo",
        "R",
        "Rare",
        "SE",
        "Secret",
        "SR",
        "Token",
        "UC",
        "Ultra",
        "Uncommon",
        "UR",
      ])
    ).toEqual([
      "Common",
      "Promo",
      "Rare",
      "Secret Rare",
      "Super Rare",
      "Ultra Rare",
      "Uncommon",
    ]);
  });

  test("filter match treats alias forms as the same rarity", () => {
    expect(cardMatchesRarityFilter("C", ["Common"])).toBe(true);
    expect(cardMatchesRarityFilter("COMMON", ["Common"])).toBe(true);
    expect(cardMatchesRarityFilter("ULTRA", ["Ultra Rare"])).toBe(true);
    expect(cardMatchesRarityFilter("CHARACTER", ["Common"])).toBe(false);
    expect(cardMatchesRarityFilter("Rare", ["Common"])).toBe(false);
  });

  test("toggle stores canonical rarity and clears aliases", () => {
    expect(rarityFilterSelected(["C", "RARE"], "Common")).toBe(true);
    expect(toggleCanonicalRarityFilter(["C", "RARE"], "Common")).toEqual(["RARE"]);
    expect(toggleCanonicalRarityFilter(["C"], "Common")).toBeUndefined();
    expect(toggleCanonicalRarityFilter(["RARE"], "Common")).toEqual([
      "RARE",
      "Common",
    ]);
  });
});
