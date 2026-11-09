import fs from "node:fs";
import path from "node:path";
import { COLOR_PRESET_VALUES, type ColorPresetChoice } from "@/lib/theme/appearance-types";
import { parseBlockPropertyNames, parseCustomPropertyNames, parseLadders, type LadderSource } from "./parse";

/** Server-only: reads the real CSS sources so the catalog tables come from them. */

export interface ColorTokenSource {
  name: string;
  /** Presets that declare it. Empty for tokens defined once in `base.css` (status colors). */
  themes: ColorPresetChoice[];
  origin: "theme" | "base";
}

export interface CatalogSource {
  ladders: LadderSource;
  colorTokens: ColorTokenSource[];
}

const STYLES_DIR = path.join(process.cwd(), "src", "styles");

function readStyle(...segments: string[]): string {
  return fs.readFileSync(path.join(STYLES_DIR, ...segments), "utf8");
}

export function readCatalogSource(): CatalogSource {
  const ladders = parseLadders(readStyle("system", "ladders.css"));

  const byName = new Map<string, ColorTokenSource>();
  for (const theme of COLOR_PRESET_VALUES) {
    for (const name of parseCustomPropertyNames(readStyle("themes", `${theme}.css`))) {
      const row = byName.get(name) ?? { name, themes: [], origin: "theme" as const };
      row.themes.push(theme);
      byName.set(name, row);
    }
  }
  for (const name of parseBlockPropertyNames(readStyle("base.css"), ":root")) {
    if (name.startsWith("--font")) continue;
    if (!byName.has(name)) byName.set(name, { name, themes: [], origin: "base" });
  }

  return { ladders, colorTokens: [...byName.values()] };
}
