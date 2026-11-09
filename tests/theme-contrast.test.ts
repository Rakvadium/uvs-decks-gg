import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { clampRgb, converter, parse, wcagContrast, type Oklch, type Rgb } from "culori";

// Token-level contrast of the built-in palettes (#216). Mirrors what the browser paints:
// color-mix(in oklch) for --control-dual-*, relative oklch() for --checkbox-border, alpha
// composited in sRGB, out-of-gamut channels clipped.

const THEMES = ["default", "calm-storm", "cyberpunk", "cotton-candy", "caffeine", "aurora", "sorbet", "singularity"];
const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];

const toOklch = converter("oklch");
const toRgb = converter("rgb");

function themeVars(theme: string, mode: Mode): Record<string, string> {
  const css = fs.readFileSync(path.join(import.meta.dir, "../src/styles/themes", `${theme}.css`), "utf8");
  const vars: Record<string, string> = {};
  const blocks = /\[data-color-theme="[^"]+"\](\.dark|:not\(\.dark\))?\s*\{([^}]*)\}/g;
  // Base block first, then the mode block, the cascade order in the theme files.
  const ordered = [...css.matchAll(blocks)].sort((a, b) => Number(Boolean(a[1])) - Number(Boolean(b[1])));
  for (const [, scope, body] of ordered) {
    if (scope === ".dark" && mode !== "dark") continue;
    if (scope === ":not(.dark)" && mode !== "light") continue;
    for (const decl of body.split(";")) {
      const i = decl.indexOf(":");
      if (i > 0) vars[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
    }
  }
  return vars;
}

function color(value: string): Oklch {
  const parsed = parse(value);
  if (!parsed) throw new Error(`not a color: ${value}`);
  return toOklch(parsed);
}

/** CSS color-mix(in oklch, a p, b): missing (achromatic) hue takes the other's, shorter arc. */
function mixOklch(a: Oklch, b: Oklch, p: number): Oklch {
  const achromatic = (c: Oklch) => !c.c || c.c < 1e-6;
  let ha = achromatic(a) ? (b.h ?? 0) : (a.h ?? 0);
  let hb = achromatic(b) ? ha : (b.h ?? 0);
  if (achromatic(a)) ha = hb;
  if (hb - ha > 180) ha += 360;
  else if (ha - hb > 180) hb += 360;
  return { mode: "oklch", l: a.l * p + b.l * (1 - p), c: (a.c ?? 0) * p + (b.c ?? 0) * (1 - p), h: (((ha * p + hb * (1 - p)) % 360) + 360) % 360 };
}

const painted = (c: Oklch): Rgb => clampRgb(toRgb(c)) as Rgb;
function over(top: Oklch, alpha: number, bottom: Oklch): Rgb {
  const t = painted(top);
  const b = painted(bottom);
  const mix = (x: number, y: number) => x * alpha + y * (1 - alpha);
  return { mode: "rgb", r: mix(t.r, b.r), g: mix(t.g, b.g), b: mix(t.b, b.b) };
}
const ratio = (a: Rgb | Oklch, b: Rgb | Oklch) =>
  wcagContrast("r" in a ? a : painted(a), "r" in b ? b : painted(b));

function palette(theme: string, mode: Mode) {
  const vars = themeVars(theme, mode);
  const get = (name: string) => {
    const value = vars[name];
    if (!value) throw new Error(`${theme} ${mode}: ${name} is not set`);
    return value;
  };
  const resolve = (value: string): Oklch => {
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    return ref ? resolve(get(ref[1])) : color(value);
  };
  const surfaces = ["--background", "--card", "--popover"].map((name) => resolve(get(name)));
  const dualMix = mixOklch(resolve(get("--primary")), resolve(get("--secondary")), 0.5);
  const dual = {
    "--control-dual-border": mixOklch(dualMix, resolve(get("--border")), 0.62),
    "--control-dual-border-strong": mixOklch(dualMix, resolve(get("--border")), 0.76),
  };
  const background = resolve(get("--background"));

  /** The checkbox border as painted over its own bg-background fill. */
  const checkboxBorder = (token: string, lightFallback: keyof typeof dual, darkAlpha: number): Rgb => {
    const value = vars[token];
    if (!value) return mode === "light" ? painted(dual[lightFallback]) : over(resolve(get("--muted-foreground")), darkAlpha, background);
    const relative = /^oklch\(from var\((--control-dual-border(?:-strong)?)\) calc\(l - ([\d.]+)\) c h\)$/.exec(value);
    if (relative) {
      const base = dual[relative[1] as keyof typeof dual];
      return painted({ ...base, l: base.l - Number(relative[2]) });
    }
    const alpha = /^color-mix\(in oklab, var\(--muted-foreground\) (\d+)%, transparent\)$/.exec(value);
    if (alpha) return over(resolve(get("--muted-foreground")), Number(alpha[1]) / 100, background);
    return painted(resolve(value));
  };

  return { vars, get, resolve, surfaces, background, checkboxBorder };
}

const combos = THEMES.flatMap((theme) => MODES.map((mode) => [theme, mode] as const));

describe("destructive fill under the #fff label", () => {
  for (const [theme, mode] of combos) {
    test(`${theme} ${mode}: #fff reaches 4.5:1 at rest and on the /90 hover`, () => {
      const p = palette(theme, mode);
      expect(p.get("--destructive-foreground")).toBe("#fff");
      const fill = p.resolve(p.get("--destructive-fill"));
      const white = color("#fff");
      expect(ratio(white, fill)).toBeGreaterThanOrEqual(4.5);
      for (const surface of p.surfaces) expect(ratio(white, over(fill, 0.9, surface))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("unchecked checkbox border (WCAG 1.4.11)", () => {
  for (const [theme, mode] of combos) {
    test(`${theme} ${mode}: rest reaches 3:1 and hover is never weaker`, () => {
      const p = palette(theme, mode);
      const rest = p.checkboxBorder("--checkbox-border", "--control-dual-border", 0.6);
      const hover = p.checkboxBorder("--checkbox-border-hover", "--control-dual-border-strong", 0.8);
      for (const surface of [p.background, p.resolve(p.get("--popover"))]) {
        expect(ratio(rest, surface)).toBeGreaterThanOrEqual(3);
        expect(ratio(hover, surface)).toBeGreaterThanOrEqual(ratio(rest, surface));
      }
    });
  }
});

test("default light: the secondary Badge text reaches 4.5:1 on its own tint", () => {
  const p = palette("default", "light");
  const ink = p.resolve(p.get("--badge-secondary"));
  const tint = p.resolve(p.get("--secondary"));
  for (const surface of p.surfaces) {
    const badge = over(tint, 0.2, surface);
    expect(ratio(ink, badge)).toBeGreaterThanOrEqual(4.5);
  }
});
