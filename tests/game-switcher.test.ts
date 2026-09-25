import { describe, expect, test } from "bun:test";
import { getHostBrand } from "@shared/games/registry";
import { PLATFORM_BRAND } from "@shared/games/types";
import { resolveHost } from "@shared/hosts";
import { buildGameSwitcherModel } from "@/games/game-links";

describe("buildGameSwitcherModel", () => {
  test("game host lists games and links All games to the apex", () => {
    const model = buildGameSwitcherModel(resolveHost("uvs.tcgdecks.localhost:8090"), "uvs");
    expect(model).not.toBeNull();
    expect(model!.current.id).toBe("uvs");
    expect(model!.games).toEqual([
      { id: "uvs", displayName: "UniVersus", shortName: "UVS", href: "/gallery", current: true },
    ]);
    expect(model!.allGamesHref).toBe("http://tcgdecks.localhost:8090/");
  });

  test("real roots use https without port", () => {
    const model = buildGameSwitcherModel(resolveHost("uvs.tcgdecks.gg"), "uvs", "http");
    expect(model!.allGamesHref).toBe("https://tcgdecks.gg/");
  });

  test("standalone and apex hosts hide the switcher", () => {
    expect(buildGameSwitcherModel(resolveHost("localhost:8090"), "uvs")).toBeNull();
    expect(buildGameSwitcherModel(resolveHost("tcgdecks.gg"), "uvs")).toBeNull();
  });
});

describe("getHostBrand", () => {
  test("apex uses the platform brand, others the game brand", () => {
    expect(getHostBrand("apex", "uvs")).toBe(PLATFORM_BRAND);
    expect(PLATFORM_BRAND.title).toBe("TCGDECKS.GG");
    for (const kind of ["game", "standalone"] as const) {
      const brand = getHostBrand(kind, "uvs");
      expect(brand.title).toBe("UVSDECKS.GG");
      expect(brand.wordmark.join("")).toBe(brand.title);
    }
  });
});
