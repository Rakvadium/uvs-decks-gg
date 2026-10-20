import { describe, expect, test } from "bun:test";
import { clampRgb, converter, parse, wcagContrast, type Rgb } from "culori";
import { DEFAULT_CUSTOM_BRAND } from "../src/lib/theme/appearance-types";
import { buildSemanticCssVars } from "../src/lib/theme/generateSemanticCssVars";

const PALETTES: [primary: string, secondary: string][] = [
  [DEFAULT_CUSTOM_BRAND.light.primary, DEFAULT_CUSTOM_BRAND.light.secondary],
  ["#ff00aa", "#101020"],
  ["#2b6cff", "#e8ecf2"],
  ["#f5f5f5", "#ffffff"],
  ["#000000", "#222222"],
];

// Light secondaries in dark mode give a light custom "dark" background, the hardest case for the
// /90 hover. The grid covers dark, mid and light secondaries in several hues.
const GRID: [primary: string, secondary: string][] = [
  ["#00b3a4", "#f4f1e8"],
  ["#4c1d95", "#ede4f7"],
  ["#7c3aed", "#140b22"],
  ["#f5e663", "#ffffff"],
  ["#f5e663", "#000000"],
  ["#00b3a4", "#0f1f1d"],
  ...["#e11d48", "#16a34a", "#2563eb", "#9333ea", "#f59e0b"].flatMap((primary) =>
    ["#ffffff", "#d4d4d8", "#a1a1aa", "#71717a", "#3f3f46", "#18181b", "#fde68a", "#bfdbfe", "#7f1d1d"].map(
      (secondary) => [primary, secondary] as [string, string],
    ),
  ),
];

const toRgb = converter("rgb");
const painted = (value: string): Rgb => clampRgb(toRgb(parse(value)!)) as Rgb;
const over = (top: Rgb, alpha: number, bottom: Rgb): Rgb => ({
  mode: "rgb",
  r: top.r * alpha + bottom.r * (1 - alpha),
  g: top.g * alpha + bottom.g * (1 - alpha),
  b: top.b * alpha + bottom.b * (1 - alpha),
});

function resolve(vars: Record<string, string>, value: string): string {
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref ? resolve(vars, vars[ref[1]]) : value;
}

describe("buildSemanticCssVars --destructive-foreground", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`is #fff in ${mode} mode, matching the built-in palettes`, () => {
      for (const [primary, secondary] of PALETTES) {
        expect(buildSemanticCssVars(primary, secondary, mode)["--destructive-foreground"]).toBe("#fff");
      }
    });
  }
});

describe("buildSemanticCssVars --destructive-fill", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`${mode}: the #fff label reaches 4.5:1 at rest and on the /90 hover over background and card`, () => {
      for (const [primary, secondary] of [...PALETTES, ...GRID]) {
        const vars = buildSemanticCssVars(primary, secondary, mode);
        const fill = painted(resolve(vars, vars["--destructive-fill"]));
        const white = painted(vars["--destructive-foreground"]);
        expect(wcagContrast(white, fill)).toBeGreaterThanOrEqual(4.5);
        for (const surface of ["--background", "--card"]) {
          expect(wcagContrast(white, over(fill, 0.9, painted(vars[surface])))).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }

  test("keeps --destructive when it already passes, and only darkens the same hue otherwise", () => {
    const [primary, secondary] = PALETTES[0];
    expect(buildSemanticCssVars(primary, secondary, "light")["--destructive-fill"]).toBe("var(--destructive)");
    const dark = buildSemanticCssVars(primary, secondary, "dark");
    const toOklch = converter("oklch");
    const base = toOklch(parse(dark["--destructive"])!);
    const fill = toOklch(parse(dark["--destructive-fill"])!);
    expect(fill.l).toBeLessThan(base.l);
    expect(Math.abs((fill.h ?? 0) - (base.h ?? 0))).toBeLessThan(0.01);
  });
});
