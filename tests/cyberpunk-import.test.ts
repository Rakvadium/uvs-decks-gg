import { describe, expect, test } from "bun:test";
import {
  collectorFileSegment,
  cyberpunkCardName,
  normalizeCollectorNumber,
  normalizeOfficialCards,
  type OfficialCard,
} from "../scripts/lib/cyberpunk-official";
import fixture from "./fixtures/cyberpunk-official-cards.json";

// convex/r2.ts builds the R2 client at import time; stub its config so the endpoint module loads.
for (const key of ["R2_BUCKET", "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]) {
  process.env[key] ??= "test";
}
const { cardImageRelativeKey } = await import("../convex/adminCardImagesHttp");

// Captured from https://api.netdeck.gg/api/cards/cyberpunk (the official cyberpunktcg.com/cards
// data source), trimmed to a few printings; image signatures replaced.
const raw = fixture as unknown as OfficialCard[];

describe("normalizeOfficialCards", () => {
  const result = normalizeOfficialCards(raw);

  test("one row per English printing; French printings skipped", () => {
    expect(result.cards).toHaveLength(6);
    expect(result.warnings).toEqual([]);
    expect(new Set(result.cards.map((c) => c.oracleId)).size).toBe(3);
  });

  test("Legend: display name, subname, stats, lowercase color, tags, legality", () => {
    const v = result.cards.find((c) => c.name === "V: Streetkid" && !c.isVariant);
    expect(v).toEqual({
      oracleId: "81a8dec7-9541-4020-93e1-7d798a57dcbc",
      name: "V: Streetkid",
      subname: "Streetkid",
      imageUrl: "wtnc/005a.webp",
      isFrontFace: true,
      isVariant: false,
      setCode: "WTNC",
      setName: "Welcome to Night City",
      setNumber: 1,
      collectorNumber: "005a",
      rarity: "Rare",
      type: "Legend",
      text:
        "{Call} Trash 3. Then, add 1 BRAINDANCE Program from your trash to your hand.\n" +
        "{Go Solo} (Pay this Legend's cost to play it as a ready Unit. It can attack this turn. " +
        "If it leaves the field, remove it from the game.)",
      color: "red",
      cost: 5,
      power: 6,
      ram: 2,
      sellable: true,
      tags: "Merc",
      artist: "Olgierd Ciszak",
      legality: "standard",
    });
  });

  test("non-canonical printings are variants in their own set with an ASCII image key", () => {
    const beta = result.cards.find((c) => c.name === "Mantis Blades" && c.setCode === "WTNC-B");
    expect(beta).toMatchObject({
      isVariant: true,
      collectorNumber: "β025",
      imageUrl: "wtnc-b/b025.webp",
      type: "Gear",
      tags: "Cyberware",
      sellable: true,
    });
    expect(beta).not.toHaveProperty("keywords");
    expect(beta).not.toHaveProperty("subname");
  });

  test("not-legal cards carry no legality; each card has exactly one gallery row", () => {
    const rebecca = result.cards.filter((c) => c.name === "Rebecca: Having a Moment");
    expect(rebecca.map((c) => c.setCode)).toEqual(["PRM01", "PRM01"]);
    expect(rebecca.every((c) => c.legality === undefined)).toBe(true);
    for (const oracleId of new Set(result.cards.map((c) => c.oracleId))) {
      expect(result.cards.filter((c) => c.oracleId === oracleId && !c.isVariant)).toHaveLength(1);
    }
  });

  test("sets and image sources", () => {
    expect(result.sets.map((s) => s.code)).toEqual(["WTNC", "WTNC-B", "PRM01"]);
    expect(result.sets[0]).toMatchObject({ officialCode: "welcometonightcityretail", legality: "standard" });
    const image = result.images.find((i) => i.imageUrl === "wtnc/005a.webp");
    expect(image?.setCode).toBe("wtnc");
    expect(image?.fileName).toBe("005a");
    expect(image?.sourceUrl).toMatch(/^https:\/\/.+\.webp$/);
    for (const i of result.images) {
      expect(cardImageRelativeKey(i.setCode, i.fileName)).toBe(i.imageUrl);
    }
  });

  test("dedupes repeated cards and printings", () => {
    const again = normalizeOfficialCards([...raw, ...raw]);
    expect(again.cards).toHaveLength(result.cards.length);
  });

  test("unmapped sets fall back with a warning", () => {
    const card = structuredClone(raw[2]);
    card.id = "x";
    card.printings = [{ ...card.printings[0], id: "p", set: { code: "newset", name: "New Set" } }];
    card.printing_id = "p";
    const out = normalizeOfficialCards([card]);
    expect(out.cards[0].setCode).toBe("NEWSET");
    expect(out.warnings[0]).toContain("Unmapped official set");
  });
});

describe("helpers", () => {
  test("collector numbers", () => {
    expect(normalizeCollectorNumber("10")).toBe("010");
    expect(normalizeCollectorNumber("005a")).toBe("005a");
    expect(normalizeCollectorNumber("β025")).toBe("β025");
    expect(collectorFileSegment("β005a")).toBe("b005a");
  });

  test("card name falls back to name — subname", () => {
    expect(cyberpunkCardName({ name: "V", subname: "Streetkid", display_name: null })).toBe("V — Streetkid");
    expect(cyberpunkCardName({ name: "Mantis Blades", subname: null, display_name: "" })).toBe("Mantis Blades");
  });

  test("upload endpoint key validation", () => {
    expect(cardImageRelativeKey("WTNC-B", "b025.webp")).toBe("wtnc-b/b025.webp");
    expect(() => cardImageRelativeKey("../x", "001")).toThrow();
    expect(() => cardImageRelativeKey("wtnc", "a/b")).toThrow();
    expect(() => cardImageRelativeKey(null, "001")).toThrow();
    expect(() => cardImageRelativeKey("wtnc", "..")).toThrow();
  });
});
