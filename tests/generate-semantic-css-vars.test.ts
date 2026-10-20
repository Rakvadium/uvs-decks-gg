import { describe, expect, test } from "bun:test";
import { DEFAULT_CUSTOM_BRAND } from "../src/lib/theme/appearance-types";
import { buildSemanticCssVars } from "../src/lib/theme/generateSemanticCssVars";

const PALETTES: [primary: string, secondary: string][] = [
  [DEFAULT_CUSTOM_BRAND.light.primary, DEFAULT_CUSTOM_BRAND.light.secondary],
  ["#ff00aa", "#101020"],
  ["#2b6cff", "#e8ecf2"],
  ["#f5f5f5", "#ffffff"],
  ["#000000", "#222222"],
];

describe("buildSemanticCssVars --destructive-foreground", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`is #fff in ${mode} mode, matching the built-in palettes`, () => {
      for (const [primary, secondary] of PALETTES) {
        expect(buildSemanticCssVars(primary, secondary, mode)["--destructive-foreground"]).toBe("#fff");
      }
    });
  }
});
