import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { compile } from "tailwindcss";
import { CHROME_VARIANT_VALUES, type ChromeVariant } from "../src/lib/theme/appearance-types";

const ROOT = path.join(import.meta.dir, "..");
const BASE_CSS = fs.readFileSync(path.join(ROOT, "src/styles/base.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const RADIUS_TOKENS = ["--radius-control", "--radius-surface", "--radius-cta", "--radius-island"] as const;
const HEIGHT_TOKENS = ["--control-h-xs", "--control-h-sm", "--control-h-md", "--control-h-lg"] as const;
const SELECTED_TOKENS = ["--selected-bg", "--selected-border", "--selected-fg", "--hover-bg"] as const;
const ROLE_TOKENS = [...RADIUS_TOKENS, ...HEIGHT_TOKENS, ...SELECTED_TOKENS];

function chromeLayersInCascadeOrder(css: string): string[] {
  const layers: string[] = [];
  for (const match of css.matchAll(/@layer chrome-[\w-]+\s*\{/g)) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    for (; depth > 0; i += 1) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") depth -= 1;
    }
    layers.push(css.slice(start, i - 1));
  }
  return layers;
}

const ROOT_CHROME_SELECTOR = /^:root(?:\[data-chrome="[a-z]+"\]|:is\((?:\[data-chrome="[a-z]+"\],?\s*)+\))$/;

function chromeVars(chrome: ChromeVariant): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const layer of chromeLayersInCascadeOrder(BASE_CSS)) {
    for (const [, rawSelector, body] of layer.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
      const selector = rawSelector.trim();
      if (!ROOT_CHROME_SELECTOR.test(selector) || !selector.includes(`[data-chrome="${chrome}"]`)) continue;
      for (const decl of body.split(";")) {
        const colon = decl.indexOf(":");
        if (colon > 0) vars[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
      }
    }
  }
  return vars;
}

function resolved(chrome: ChromeVariant): Record<string, string | undefined> {
  const vars = chromeVars(chrome);
  const substitute = (value: string): string =>
    value.replace(/var\((--[\w-]+)\)/g, (ref, name: string) => (name in vars ? substitute(vars[name]) : ref));
  return Object.fromEntries(ROLE_TOKENS.map((token) => [token, vars[token] === undefined ? undefined : substitute(vars[token])]));
}

const SHARED = {
  "--control-h-xs": "28px",
  "--control-h-sm": "32px",
  "--control-h-md": "40px",
  "--control-h-lg": "48px",
  "--selected-bg": "color-mix(in oklab, var(--accent) 20%, transparent)",
  "--selected-border": "color-mix(in oklab, var(--accent) 60%, transparent)",
  "--selected-fg": "var(--accent)",
  "--hover-bg": "color-mix(in oklab, var(--accent) 10%, transparent)",
};

const EXPECTED: Record<ChromeVariant, Record<string, string>> = {
  calm: {
    "--radius-control": "calc(0.625rem - 2px)",
    "--radius-surface": "0.625rem",
    "--radius-cta": "9999px",
    "--radius-island": "9999px",
    ...SHARED,
  },
  bubblegum: {
    "--radius-control": "calc(0.4rem - 2px)",
    "--radius-surface": "0.4rem",
    "--radius-cta": "0.4rem",
    "--radius-island": "0.4rem",
    ...SHARED,
  },
  darkmatter: {
    "--radius-control": "calc(0.75rem - 2px)",
    "--radius-surface": "0.75rem",
    "--radius-cta": "9999px",
    "--radius-island": "9999px",
    ...SHARED,
  },
  expressive: {
    "--radius-control": "calc(0.625rem - 2px)",
    "--radius-surface": "0.625rem",
    "--radius-cta": "9999px",
    "--radius-island": "9999px",
    ...SHARED,
  },
  holoterminal: {
    "--radius-control": "calc(0.375rem - 2px)",
    "--radius-surface": "0.375rem",
    "--radius-cta": "0.375rem",
    "--radius-island": "0.375rem",
    ...SHARED,
  },
};

describe("chrome role tokens", () => {
  test("the test covers every chrome the app offers", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...CHROME_VARIANT_VALUES].sort());
  });

  for (const chrome of CHROME_VARIANT_VALUES) {
    test(`${chrome} sets all 12 role tokens to its values`, () => {
      expect(resolved(chrome)).toEqual(EXPECTED[chrome]);
    });

    test(`${chrome} gives CTAs and islands one radius`, () => {
      const tokens = resolved(chrome);
      expect(tokens["--radius-cta"]).toBe(tokens["--radius-island"]);
    });
  }

  test("selected and hover tokens hold no literal colour, only steps of --accent", () => {
    const accentOnly = /^(?:var\(--accent\)|color-mix\(in oklab, var\(--accent\) \d+%, transparent\))$/;
    const offenders = CHROME_VARIANT_VALUES.flatMap((chrome) => {
      const vars = chromeVars(chrome);
      return SELECTED_TOKENS.filter((token) => !accentOnly.test(vars[token] ?? "")).map((token) => `${chrome} ${token}: ${vars[token]}`);
    });
    expect(offenders).toEqual([]);
  });
});

describe("compiled role utilities", async () => {
  const compiler = await compile(
    `@import "tailwindcss";\n@import "./src/styles/base.css";\n@import "./src/styles/system/ladders.css";`,
    {
      base: ROOT,
      loadStylesheet: async (id, base) => {
        const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
        return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
      },
    },
  );
  const css = compiler
    .build(["rounded-control", "rounded-surface", "rounded-cta", "rounded-island", "bg-accent-selected", "bg-accent-wash", "border-accent-strong"])
    .replaceAll("\r\n", "\n");

  const ruleBody = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    if (start < 0) return null;
    const end = css.indexOf("\n  }\n", start);
    return css.slice(start + selector.length + 2, end).replace(/\s+/g, " ").trim();
  };

  test("rounded-control, rounded-surface, rounded-cta and rounded-island read the role tokens", () => {
    expect(RADIUS_TOKENS.map((token) => ruleBody(`.rounded-${token.slice("--radius-".length)}`))).toEqual([
      "border-radius: var(--radius-control);",
      "border-radius: var(--radius-surface);",
      "border-radius: var(--radius-cta);",
      "border-radius: var(--radius-island);",
    ]);
  });

  test("the radius mapping writes no self-referencing variable", () => {
    expect(css).not.toMatch(/--radius-(?:control|surface|cta|island):\s*var\(--radius-(?:control|surface|cta|island)\)/);
  });

  test("selected and hover tokens compile to the tone ladder utilities", () => {
    const declared = (token: string) => {
      const start = css.indexOf(`${token}:`);
      const end = css.indexOf("}", css.indexOf(`${token}:`, start + 1)) + 1;
      return css.slice(start, end).replaceAll(token, "").replace(/\s+/g, " ").trim();
    };
    const utility = (selector: string, property: string) => ruleBody(selector)!.replaceAll(property, "");
    expect(declared("--selected-bg")).toBe(utility(".bg-accent-selected", "background-color"));
    expect(declared("--hover-bg")).toBe(utility(".bg-accent-wash", "background-color"));
    expect(declared("--selected-border")).toBe(utility(".border-accent-strong", "border-color"));
  });
});
