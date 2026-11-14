import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { GAME_IDS } from "@shared/games/types";
import { getSharedGameModule } from "@shared/games/registry";
import { COLOR_PRESET_VALUES, COLOR_THEME_VALUES, resolveColorTheme } from "@/lib/theme/appearance-types";

describe("game color themes", () => {
  test("the saved `default` preset follows the current game", () => {
    expect(resolveColorTheme("default", "universus")).toBe("universus");
    expect(resolveColorTheme("default", "cyberpunk")).toBe("cyberpunk");
    expect(resolveColorTheme("universus", "cyberpunk")).toBe("universus");
    expect(resolveColorTheme("aurora", "universus")).toBe("aurora");
  });

  test("every game theme and game mark ships", () => {
    for (const id of GAME_IDS) {
      const game = getSharedGameModule(id);
      expect(COLOR_THEME_VALUES).toContain(game.colorTheme);
      expect(fs.existsSync(path.join(import.meta.dir, "../public", game.markSrc))).toBe(true);
    }
  });

  test("every built-in theme has a stylesheet scoped to its id", () => {
    for (const theme of COLOR_THEME_VALUES) {
      const css = fs.readFileSync(path.join(import.meta.dir, "../src/styles/themes", `${theme}.css`), "utf8");
      expect(css).toContain(`[data-color-theme="${theme}"]`);
    }
  });

  test("the Convex preset validator accepts every client preset", () => {
    const validators = fs.readFileSync(path.join(import.meta.dir, "../convex/validators.ts"), "utf8");
    const block = /export const colorPresetValidator = v\.union\(([\s\S]*?)\);/.exec(validators)?.[1] ?? "";
    const literals = [...block.matchAll(/v\.literal\("([^"]+)"\)/g)].map((m) => m[1]).sort();
    expect(literals).toEqual([...COLOR_PRESET_VALUES].sort());
  });
});
