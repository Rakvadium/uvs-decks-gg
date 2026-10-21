import { describe, expect, test } from "bun:test";
import { printedRarityLabel } from "../convex/lib/printedRarity";
import { draftFieldsFromFileName } from "../convex/lib/draftFileName";
import { applyRegionZones } from "../convex/lib/visionZones";

describe("printedRarityLabel", () => {
  test("maps printed codes to stored labels", () => {
    expect(printedRarityLabel("C")).toBe("Common");
    expect(printedRarityLabel("UC")).toBe("Uncommon");
    expect(printedRarityLabel("u")).toBe("Uncommon");
    expect(printedRarityLabel("R")).toBe("Rare");
    expect(printedRarityLabel("UR")).toBe("Ultra");
    expect(printedRarityLabel("Ultra Rare")).toBe("Ultra");
    expect(printedRarityLabel("SR")).toBe("Secret");
    expect(printedRarityLabel("Secret Rare")).toBe("Secret");
    expect(printedRarityLabel("PR")).toBe("Promo");
  });

  test("uses the code after CH on Characters", () => {
    expect(printedRarityLabel("CH-R")).toBe("Rare");
    expect(printedRarityLabel("CH C")).toBe("Common");
    expect(printedRarityLabel("CH")).toBe("Character");
    expect(printedRarityLabel("Character")).toBe("Character");
  });

  test("drops values it does not recognise", () => {
    expect(printedRarityLabel("Attack")).toBeUndefined();
    expect(printedRarityLabel("")).toBeUndefined();
    expect(printedRarityLabel(undefined)).toBeUndefined();
  });
});

describe("draftFieldsFromFileName", () => {
  test("reads CH-<code> Character scans", () => {
    expect(draftFieldsFromFileName("FT01-001-CH-R-CanaAlberonaCardslinger.png")).toEqual({
      setCode: "FT01",
      collectorNumber: "001",
      rarity: "Rare",
      isVariant: false,
      name: "Cana Alberona Cardslinger",
    });
  });

  test("reads plain rarity codes and bare CH", () => {
    expect(draftFieldsFromFileName("FT01-071-UR-AllFiredUp.png").rarity).toBe("Ultra");
    expect(draftFieldsFromFileName("FT01-058-SR-UnisonRaid.png").rarity).toBe("Secret");
    const bison = draftFieldsFromFileName("SF621-001-CH-MBisonWrithingEvil.png");
    expect(bison.rarity).toBe("Character");
    expect(bison.name).toBe("M Bison Writhing Evil");
  });
});

type Ocr = { type?: string; attackZone?: string; blockZone?: string };
const ocr = (type?: string): Ocr => (type ? { type } : {});

describe("applyRegionZones", () => {
  test("keeps the attack zone only on attacks", () => {
    expect(applyRegionZones(ocr("Attack"), { attackZone: "mid", blockZone: "low" })).toEqual({
      type: "Attack",
      attackZone: "mid",
      blockZone: "low",
    });
    expect(applyRegionZones(ocr("Foundation"), { attackZone: "mid", blockZone: "low" })).toEqual({
      type: "Foundation",
      blockZone: "low",
    });
  });

  test("drops both zones on Characters", () => {
    expect(applyRegionZones(ocr("Character"), { attackZone: "mid", blockZone: "high" })).toEqual({
      type: "Character",
    });
  });

  test("keeps zones for review when the type was not read", () => {
    expect(applyRegionZones(ocr(), { attackZone: "high" })).toEqual({ attackZone: "high" });
  });
});
