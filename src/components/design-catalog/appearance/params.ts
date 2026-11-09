import {
  CHROME_VARIANT_VALUES,
  COLOR_PRESET_VALUES,
  type ChromeVariant,
  type ColorPresetChoice,
} from "@/lib/theme/appearance-types";

/**
 * The catalog's page-scoped appearance. It lives in the URL (`?theme=&mode=&chrome=`) and on
 * `<html>` while `/design` is mounted. It never reaches the user's saved session.
 */

export type CatalogMode = "light" | "dark";

export interface CatalogAppearance {
  theme: ColorPresetChoice;
  mode: CatalogMode;
  chrome: ChromeVariant;
}

/** Axes the URL pins. Missing axes follow whatever the app put on `<html>`. */
export type CatalogOverride = Partial<CatalogAppearance>;

export const CATALOG_MODES = ["light", "dark"] as const satisfies readonly CatalogMode[];

export const APPEARANCE_PARAM_KEYS = ["theme", "mode", "chrome"] as const;

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

function pick<T extends string>(allowed: readonly T[], value: string | undefined): T | undefined {
  return value !== undefined && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Only allow-listed values survive, so the result is safe to write into an inline script. */
export function parseCatalogOverride(source: ParamSource): CatalogOverride {
  const override: CatalogOverride = {};
  const theme = pick(COLOR_PRESET_VALUES, readParam(source, "theme"));
  const mode = pick(CATALOG_MODES, readParam(source, "mode"));
  const chrome = pick(CHROME_VARIANT_VALUES, readParam(source, "chrome"));
  if (theme) override.theme = theme;
  if (mode) override.mode = mode;
  if (chrome) override.chrome = chrome;
  return override;
}

export function hasOverride(override: CatalogOverride): boolean {
  return APPEARANCE_PARAM_KEYS.some((key) => override[key] !== undefined);
}

/** Writes the override into `params`, dropping axes it doesn't pin. Other params are kept. */
export function writeCatalogOverride(params: URLSearchParams, override: CatalogOverride): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of APPEARANCE_PARAM_KEYS) {
    const value = override[key];
    if (value === undefined) next.delete(key);
    else next.set(key, value);
  }
  return next;
}

/** The catalog chapter shown on its own (`?focus=forms`), or null for the whole catalog. */
export function parseFocus<T extends string>(source: ParamSource, chapters: readonly T[]): T | null {
  return pick(chapters, readParam(source, "focus")) ?? null;
}

/**
 * A blocking inline script that pins the override on `<html>` before first paint, so a deep link
 * doesn't flash the default theme before hydration. Values are allow-listed by
 * `parseCatalogOverride`, and JSON.stringify quotes them.
 */
export function overrideBootScript(override: CatalogOverride): string | null {
  if (!hasOverride(override)) return null;
  const lines = ["var r=document.documentElement;"];
  if (override.theme) lines.push(`r.setAttribute("data-color-theme",${JSON.stringify(override.theme)});`);
  if (override.chrome) lines.push(`r.setAttribute("data-chrome",${JSON.stringify(override.chrome)});`);
  if (override.mode) {
    const dark = override.mode === "dark";
    lines.push(`r.classList.toggle("dark",${dark});r.style.colorScheme=${JSON.stringify(override.mode)};`);
  }
  return `(function(){${lines.join("")}})();`;
}
