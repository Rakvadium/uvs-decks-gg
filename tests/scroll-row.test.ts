import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { compile } from "tailwindcss";
import { CHROME_VARIANT_VALUES, type ChromeVariant } from "../src/lib/theme/appearance-types";

const ROOT = path.join(import.meta.dir, "..");
const BASE_CSS = fs.readFileSync(path.join(ROOT, "src/styles/base.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function chromeVars(chrome: ChromeVariant): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const match of BASE_CSS.matchAll(/@layer chrome-[\w-]+\s*\{/g)) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    for (; depth > 0; i += 1) {
      if (BASE_CSS[i] === "{") depth += 1;
      if (BASE_CSS[i] === "}") depth -= 1;
    }
    for (const [, rawSelector, body] of BASE_CSS.slice(start, i - 1).matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
      const selector = rawSelector.trim();
      if (!selector.startsWith(":root") || selector.includes(".dark") || !selector.includes(`[data-chrome="${chrome}"]`)) continue;
      for (const decl of body.split(";")) {
        const colon = decl.indexOf(":");
        if (colon > 0) vars[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
      }
    }
  }
  return vars;
}

function splitLayers(value: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      layers.push(current);
      current = "";
    } else current += ch;
  }
  return [...layers, current];
}

function shadowReach(value: string): number {
  let reach = 0;
  for (const layer of splitLayers(value)) {
    if (/\binset\b/.test(layer)) continue;
    let lengths = layer;
    while (/[a-z-]+\([^()]*\)/i.test(lengths)) lengths = lengths.replace(/[a-z-]+\([^()]*\)/gi, "");
    const [x = 0, y = 0, blur = 0, spread = 0] = (lengths.match(/-?[\d.]+px|\b0\b/g) ?? []).map(parseFloat);
    reach = Math.max(reach, x + blur + spread, y + blur + spread);
  }
  return reach;
}

const CONTROL_SHADOW = /^--chrome-(?:button|badge|floating|search-field|focus|shell-[\w-]+-active)-?[\w-]*shadow[\w-]*$/;

function controlShadowReach(chrome: ChromeVariant): number {
  const vars = chromeVars(chrome);
  const substitute = (value: string): string =>
    value.replace(/var\((--[\w-]+)\)/g, (ref, name: string) => (name in vars ? substitute(vars[name]) : ref));
  return Math.max(0, ...Object.keys(vars).filter((name) => CONTROL_SHADOW.test(name)).map((name) => shadowReach(substitute(vars[name]))));
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : [];
  });
}

const SCROLL_ROWS = [
  "src/components/gallery/gallery-top-bar-filters/variants/filter-tokens.tsx",
  "src/components/gallery/gallery-top-bar-filters/variants/desktop-filter-pages.tsx",
  "src/components/gallery/mobile-filter-sheet/picker-page.tsx",
  "src/components/gallery/mobile-filter-sheet/root-page.tsx",
  "src/components/shell/app-page-header.tsx",
];

describe("chrome shadow reach", () => {
  test("bubblegum's reach covers its hard offset control shadows", () => {
    expect(controlShadowReach("bubblegum")).toBe(4);
    expect(chromeVars("bubblegum")["--chrome-shadow-reach"]).toBe("4px");
  });

  for (const chrome of CHROME_VARIANT_VALUES.filter((c) => c !== "bubblegum")) {
    test(`${chrome} keeps a zero reach, so its scroll rows keep their layout`, () => {
      expect(chromeVars(chrome)["--chrome-shadow-reach"]).toBe("0px");
    });
  }
});

describe("scroll rows", async () => {
  test("no row hand-rolls a hidden horizontal scrollbar", () => {
    const offenders = sourceFiles(path.join(ROOT, "src"))
      .filter((file) => /scrollbar-width:none|::-webkit-scrollbar\]:hidden/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file).replaceAll("\\", "/"));
    expect(offenders).toEqual([]);
  });

  test("every chip and tab row that scrolls sideways uses scroll-row", () => {
    expect(SCROLL_ROWS.filter((file) => !/\bscroll-row\b/.test(fs.readFileSync(path.join(ROOT, file), "utf8")))).toEqual([]);
  });

  const compiler = await compile(`@import "tailwindcss";\n@import "./src/styles/base.css";`, {
    base: ROOT,
    loadStylesheet: async (id, base) => {
      const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
    },
  });
  const css = compiler.build(["px-4", "pb-1", "scroll-row"]).replaceAll("\r\n", "\n");
  const utilities = css.slice(css.indexOf("@layer utilities"));

  test("scroll-row scrolls sideways with no scrollbar and pads the chrome's shadow reach below and at the end", () => {
    const start = utilities.indexOf(".scroll-row {");
    const body = utilities.slice(start, utilities.indexOf("\n  }\n", start)).replace(/\s+/g, " ");
    expect(body).toBe(
      ".scroll-row { overflow-x: auto; overflow-y: hidden; scrollbar-width: none; padding-block-end: var(--chrome-shadow-reach); padding-inline-end: var(--chrome-shadow-reach); &::-webkit-scrollbar { display: none; }",
    );
  });

  test("a row's own padding utilities still win over scroll-row", () => {
    const at = (selector: string) => utilities.indexOf(`${selector} {`);
    expect(at(".scroll-row")).toBeGreaterThan(-1);
    expect(at(".scroll-row")).toBeLessThan(at(".px-4"));
    expect(at(".scroll-row")).toBeLessThan(at(".pb-1"));
  });
});
