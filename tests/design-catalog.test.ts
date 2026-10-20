import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { isDesignCatalogEnabled } from "../src/lib/design-catalog-gate";
import {
  overrideBootScript,
  parseCatalogOverride,
  parseFocus,
  writeCatalogOverride,
} from "../src/components/design-catalog/appearance/params";
import { CATALOG_CHAPTERS, CHAPTER_IDS, type CatalogChapter, type UiSource } from "../src/components/design-catalog/registry";
import { parseLadders, parseBlockPropertyNames } from "../src/components/design-catalog/source/parse";
import { readCatalogSource } from "../src/components/design-catalog/source/read";
import { LADDER_SAFELIST } from "../src/components/design-catalog/foundations/ladder-safelist";

const ROOT = path.join(import.meta.dir, "..");
const UI_DIR = path.join(ROOT, "src/components/ui");
const CATALOG_DIR = path.join(ROOT, "src/components/design-catalog");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Every export of a ui file, split into runtime values and type-only names. */
function parseExports(source: string): { runtime: Set<string>; types: Set<string> } {
  const runtime = new Set<string>();
  const types = new Set<string>();
  for (const match of source.matchAll(/^export\s+(?:async\s+)?(function|const|let|class)\s+([A-Za-z0-9_]+)/gm)) {
    runtime.add(match[2]);
  }
  for (const match of source.matchAll(/^export\s+(interface|type)\s+([A-Za-z0-9_]+)/gm)) {
    types.add(match[2]);
  }
  for (const match of source.matchAll(/^export\s+(type\s+)?\{([^}]*)\}/gm)) {
    const typeOnly = Boolean(match[1]);
    for (const raw of match[2].split(",")) {
      const item = raw.trim();
      if (!item) continue;
      const isType = typeOnly || item.startsWith("type ");
      const name = item.replace(/^type\s+/, "").split(/\s+as\s+/).pop()!.trim();
      (isType ? types : runtime).add(name);
    }
  }
  return { runtime, types };
}

const uiFiles = readdirSync(UI_DIR).filter((name) => name.endsWith(".tsx"));
const chapters = CATALOG_CHAPTERS as readonly CatalogChapter[];
const sources: UiSource[] = chapters.flatMap((chapter) => chapter.entries.flatMap((entry) => entry.ui ?? []));
const catalogFiles = walk(CATALOG_DIR).filter((file) => /\.tsx?$/.test(file));
const catalogText = catalogFiles.map((file) => readFileSync(file, "utf8"));

/** Names the catalog imports from each `@/components/ui/<file>`. */
const importedFromUi = new Map<string, Set<string>>();
for (const text of catalogText) {
  for (const match of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@\/components\/ui\/([a-z0-9-]+)"/g)) {
    const names = importedFromUi.get(`${match[2]}.tsx`) ?? new Set<string>();
    for (const raw of match[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (name) names.add(name);
    }
    importedFromUi.set(`${match[2]}.tsx`, names);
  }
}

describe("/design gate", () => {
  test("on in next dev and on Vercel preview, off everywhere else", () => {
    expect(isDesignCatalogEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isDesignCatalogEnabled({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(true);
    expect(isDesignCatalogEnabled({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(false);
    expect(isDesignCatalogEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isDesignCatalogEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(isDesignCatalogEnabled({})).toBe(false);
  });
});

describe("catalog appearance params", () => {
  test("keeps only allow-listed theme, mode and chrome values", () => {
    expect(parseCatalogOverride(new URLSearchParams("theme=aurora&mode=dark&chrome=expressive"))).toEqual({
      theme: "aurora",
      mode: "dark",
      chrome: "expressive",
    });
    expect(parseCatalogOverride({ theme: "custom", mode: "system", chrome: ["calm", "darkmatter"] })).toEqual({ chrome: "calm" });
    expect(parseCatalogOverride(new URLSearchParams('theme=</script><script>alert(1)</script>'))).toEqual({});
  });

  test("writes the override and keeps unrelated params", () => {
    const next = writeCatalogOverride(new URLSearchParams("focus=forms&theme=aurora&mode=dark"), { theme: "sorbet" });
    expect(next.get("focus")).toBe("forms");
    expect(next.get("theme")).toBe("sorbet");
    expect(next.has("mode")).toBe(false);
  });

  test("boot script only appears for a pin and only carries allow-listed values", () => {
    expect(overrideBootScript({})).toBeNull();
    const script = overrideBootScript(parseCatalogOverride(new URLSearchParams("theme=cyberpunk&mode=dark&chrome=x")))!;
    expect(script).toContain('"cyberpunk"');
    expect(script).toContain('classList.toggle("dark",true)');
    expect(script).not.toContain("data-chrome");
  });

  test("focus accepts chapter ids only", () => {
    expect(parseFocus(new URLSearchParams("focus=forms"), CHAPTER_IDS)).toBe("forms");
    expect(parseFocus(new URLSearchParams("focus=nope"), CHAPTER_IDS)).toBeNull();
  });
});

describe("catalog coverage of src/components/ui", () => {
  test("every ui file has a catalog entry", () => {
    const listed = new Set(sources.map((source) => source.file));
    expect(uiFiles.filter((file) => !listed.has(file))).toEqual([]);
    expect([...listed].filter((file) => !uiFiles.includes(file))).toEqual([]);
  });

  test.each(uiFiles)("%s: every export is listed, and nothing listed is stale", (file) => {
    const { runtime, types } = parseExports(readFileSync(path.join(UI_DIR, file), "utf8"));
    const listed = new Set(sources.filter((source) => source.file === file).flatMap((source) => source.exports));
    const exported = new Set([...runtime, ...types]);
    expect([...exported].filter((name) => !listed.has(name)).sort()).toEqual([]);
    expect([...listed].filter((name) => !exported.has(name)).sort()).toEqual([]);
  });

  test.each(uiFiles)("%s: every runtime export is rendered from the real module (or says why not)", (file) => {
    const { runtime } = parseExports(readFileSync(path.join(UI_DIR, file), "utf8"));
    const documented = Object.assign({}, ...sources.filter((source) => source.file === file).map((source) => source.documentedOnly ?? {}));
    const imported = importedFromUi.get(file) ?? new Set<string>();
    const missing = [...runtime].filter((name) => !imported.has(name) && !(name in documented));
    expect(missing.sort()).toEqual([]);
    for (const name of Object.keys(documented)) expect(runtime.has(name)).toBe(true);
  });

  test("entry ids are unique", () => {
    const ids = chapters.flatMap((chapter) => chapter.entries.map((entry) => entry.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("catalog sources", () => {
  const ladders = parseLadders(readFileSync(path.join(ROOT, "src/styles/system/ladders.css"), "utf8"));

  test("every ladders.css utility lands in a known ladder", () => {
    expect(ladders.utilities.length).toBeGreaterThan(0);
    expect(ladders.unclassified).toEqual([]);
    for (const row of ladders.tones) expect(row.steps.map((step) => `${step.property}-${step.step}`)).toEqual(ladders.tones[0].steps.map((step) => `${step.property}-${step.step}`));
    expect(ladders.zIndex.find((step) => step.name === "z-sticky")?.value).toBe(30);
    expect(ladders.tones[0].steps[0]).toMatchObject({ name: "bg-primary-wash", alias: "bg-primary/10" });
  });

  test("every ladders.css utility is written out for Tailwind to emit", () => {
    const written = new Set(LADDER_SAFELIST.split(/\s+/).filter(Boolean));
    expect(ladders.utilities.map((utility) => utility.name).filter((name) => !written.has(name))).toEqual([]);
  });

  test("color tokens come from every preset plus base.css status colors", () => {
    const { colorTokens } = readCatalogSource();
    const names = colorTokens.map((token) => token.name);
    for (const name of ["--background", "--primary", "--ring", "--chart-1", "--success", "--warning-foreground", "--info"]) {
      expect(names).toContain(name);
    }
    expect(colorTokens.find((token) => token.name === "--primary")?.themes.length).toBe(8);
    expect(parseBlockPropertyNames(":root {\n --a: 1;\n}\n:root.dark { --b: 2; }", ":root")).toEqual(["--a"]);
  });
});

describe("catalog never writes appearance prefs", () => {
  test("no Convex calls or ColorSchemeProvider setters in the catalog", () => {
    const forbidden = [
      /useMutation|useAction|convex\/react/,
      /\bupdateSession\b/,
      /\.(setTheme|setChrome|setAppearancePreset|setAppearanceCustom|touchAppearanceCustom|toggleThemeLightDark)\b/,
      /\{[^}]*\b(setTheme|setChrome|setAppearancePreset|setAppearanceCustom|touchAppearanceCustom|toggleThemeLightDark)\b[^}]*\}\s*=\s*useColorScheme/,
    ];
    const hits = catalogFiles.flatMap((file, index) =>
      forbidden.filter((pattern) => pattern.test(catalogText[index])).map((pattern) => `${path.relative(ROOT, file)} ${pattern}`),
    );
    expect(hits).toEqual([]);
  });
});
