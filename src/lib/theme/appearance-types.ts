import type { GameColorTheme } from "@shared/games/types";

/** Built-in palettes. Each has `src/styles/themes/<id>.css` and is a `data-color-theme` value. */
export const COLOR_THEME_VALUES = [
  "universus",
  "cyberpunk",
  "calm-storm",
  "cotton-candy",
  "caffeine",
  "aurora",
  "sorbet",
  "singularity",
] as const;

export type ColorTheme = (typeof COLOR_THEME_VALUES)[number];

/** Saved presets. `default` follows the current game's `colorTheme`. */
export const COLOR_PRESET_VALUES = ["default", ...COLOR_THEME_VALUES] as const;

export type ColorPresetChoice = (typeof COLOR_PRESET_VALUES)[number];

export function resolveColorTheme(preset: ColorPresetChoice, gameTheme: GameColorTheme): ColorTheme {
  return preset === "default" ? gameTheme : preset;
}

export const CHROME_VARIANT_VALUES = [
  "calm",
  "expressive",
  "holoterminal",
  "bubblegum",
  "darkmatter",
] as const;

export type ChromeVariant = (typeof CHROME_VARIANT_VALUES)[number];

export type ThemePreference = "light" | "dark" | "system";

export type AppearanceModePair = {
  light: { primary: string; secondary: string };
  dark: { primary: string; secondary: string };
};

export type AppearanceCustom = {
  fallback: AppearanceModePair;
  byChrome?: Partial<Record<ChromeVariant, AppearanceModePair>>;
};

export type PersistedColorSource =
  | { kind: "preset"; preset: ColorPresetChoice }
  | { kind: "custom"; custom: AppearanceCustom };

export const DEFAULT_CUSTOM_BRAND: AppearanceModePair = {
  light: { primary: "#ff5000", secondary: "#272b27" },
  dark: { primary: "#ff5000", secondary: "#272b27" },
};
