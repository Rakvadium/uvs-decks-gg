import { describe, expect, test } from "bun:test";
import path from "node:path";
import sharp from "sharp";
import {
  isAttunedSymbolShape,
  matchResourceSymbols,
  RESOURCE_SYMBOL_NAMES,
  symbolTemplateVector,
  type ResourceSymbolTemplate,
  type Rgba,
} from "../src/lib/universus/match-resource-symbols";

async function loadRgba(filePath: string): Promise<Rgba> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

async function loadTemplates(): Promise<ResourceSymbolTemplate[]> {
  const symbolDir = path.resolve(import.meta.dir, "../public/universus/symbols");
  const templates: ResourceSymbolTemplate[] = [];
  for (const name of RESOURCE_SYMBOL_NAMES) {
    const img = await loadRgba(path.join(symbolDir, `${name}.png`));
    templates.push({ id: name, pixels: symbolTemplateVector(img) });
  }
  return templates;
}

describe("match resource symbols", () => {
  test("classifies official symbol art as circle vs square", async () => {
    const symbolDir = path.resolve(import.meta.dir, "../public/universus/symbols");
    expect(isAttunedSymbolShape(await loadRgba(path.join(symbolDir, "air.png")))).toBe(false);
    expect(isAttunedSymbolShape(await loadRgba(path.join(symbolDir, "evil.png")))).toBe(false);
    expect(isAttunedSymbolShape(await loadRgba(path.join(symbolDir, "attuned-air.png")))).toBe(true);
    expect(isAttunedSymbolShape(await loadRgba(path.join(symbolDir, "attuned-life.png")))).toBe(true);
  });
  test("reads all|evil|void from a printed-style bottom strip", async () => {
    const width = 744;
    const height = 1039;
    const symbolDir = path.resolve(import.meta.dir, "../public/universus/symbols");
    const icon = 40;
    const y = height - 62;
    const base = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 18, g: 18, b: 22, alpha: 1 },
      },
    });
    const bar = await sharp({
      create: {
        width: 3,
        height: 36,
        channels: 4,
        background: { r: 245, g: 245, b: 245, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    const logo = await sharp(path.join(symbolDir, "death.png")).resize(icon, icon).png().toBuffer();
    const all = await sharp(path.join(symbolDir, "all.png")).resize(icon, icon).png().toBuffer();
    const evil = await sharp(path.join(symbolDir, "evil.png")).resize(icon, icon).png().toBuffer();
    const voidIcon = await sharp(path.join(symbolDir, "void.png")).resize(icon, icon).png().toBuffer();
    const composed = await base
      .composite([
        { input: logo, left: 48, top: y },
        { input: bar, left: 100, top: y + 2 },
        { input: all, left: 114, top: y },
        { input: evil, left: 159, top: y },
        { input: voidIcon, left: 205, top: y },
      ])
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    const templates = await loadTemplates();
    const symbols = matchResourceSymbols(
      { width: composed.info.width, height: composed.info.height, data: composed.data },
      templates,
    );
    expect(symbols).toEqual(["all", "evil", "void"]);
  });

  test("treats official circle templates as normal and square templates as attuned", async () => {
    const width = 744;
    const height = 1039;
    const symbolDir = path.resolve(import.meta.dir, "../public/universus/symbols");
    const icon = 40;
    const y = height - 62;
    const base = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 18, g: 18, b: 22, alpha: 1 },
      },
    });
    const bar = await sharp({
      create: {
        width: 3,
        height: 36,
        channels: 4,
        background: { r: 245, g: 245, b: 245, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    const logo = await sharp(path.join(symbolDir, "death.png")).resize(icon, icon).png().toBuffer();
    const air = await sharp(path.join(symbolDir, "attuned-air.png")).resize(icon, icon).png().toBuffer();
    const life = await sharp(path.join(symbolDir, "attuned-life.png")).resize(icon, icon).png().toBuffer();
    const composed = await base
      .composite([
        { input: logo, left: 48, top: y },
        { input: bar, left: 100, top: y + 2 },
        { input: air, left: 114, top: y },
        { input: life, left: 159, top: y },
      ])
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    const templates = await loadTemplates();
    const symbols = matchResourceSymbols(
      { width: composed.info.width, height: composed.info.height, data: composed.data },
      templates,
    );
    expect(symbols).toEqual(["attuned:air", "attuned:life"]);
  });

  test("reads printed SF6 Part Deux icons when local PNGs exist", async () => {
    const pngDir = path.resolve(import.meta.dir, "../data/sf6-part-deux/png");
    const departure = path.join(pngDir, "SF621-004-UC-Departure.png");
    const cammy = path.join(pngDir, "SF622-001-CH-CammyKillerBee.png");
    const bison = path.join(pngDir, "SF621-001-CH-MBisonWrithingEvil.png");
    const duo = path.join(pngDir, "SF622-003-C-UnlikelyDuo.png");
    const interdiction = path.join(pngDir, "SF621-006-UR-Interdiction.png");
    const { existsSync } = await import("node:fs");
    const unlimited = path.join(pngDir, "SF621-012-UR-UnlimitedPsychoCrusher.png");
    const knee = path.join(pngDir, "SF621-007-R-KneePressNightmare.png");
    const bisonWho = path.join(pngDir, "SF621-013-C-BisonWhoIsThat.png");
    const deltaRed = path.join(pngDir, "SF622-005-UR-DeltaRedAssault.png");
    if (
      ![departure, cammy, bison, duo, interdiction, unlimited, knee, bisonWho, deltaRed].every((file) =>
        existsSync(file),
      )
    ) {
      return;
    }
    const templates = await loadTemplates();
    expect(matchResourceSymbols(await loadRgba(bison), templates)).toEqual(["all", "evil", "void"]);
    expect(matchResourceSymbols(await loadRgba(interdiction), templates)).toEqual(["evil"]);
    expect(matchResourceSymbols(await loadRgba(unlimited), templates)).toEqual(["attuned:all"]);
    expect(matchResourceSymbols(await loadRgba(knee), templates)).toEqual(["attuned:all"]);
    expect(matchResourceSymbols(await loadRgba(departure), templates)).toEqual(["attuned:evil"]);
    expect(matchResourceSymbols(await loadRgba(duo), templates)).toEqual([
      "attuned:air",
      "attuned:life",
    ]);
    expect(matchResourceSymbols(await loadRgba(cammy), templates)).toEqual(["air", "chaos", "life"]);
    expect(matchResourceSymbols(await loadRgba(bisonWho), templates)).toEqual(["attuned:evil"]);
    expect(matchResourceSymbols(await loadRgba(deltaRed), templates)).toEqual(["attuned:life"]);
  });
});
