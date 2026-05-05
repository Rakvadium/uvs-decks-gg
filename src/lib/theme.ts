"use client";

import { useColorScheme } from "@/providers/ColorSchemeProvider";

export {
  ColorSchemeProvider,
  useChromeMode,
  useChromeVariant,
  useColorScheme,
  COLOR_SCHEMES,
  COLOR_PRESET_OPTIONS,
  CHROME_OPTIONS,
} from "@/providers/ColorSchemeProvider";
export type { ChromeMode } from "@/providers/ColorSchemeProvider";
export type {
  ChromeVariant,
  ColorPresetChoice,
  ThemePreference,
} from "@/lib/theme/appearance-types";
export type ColorScheme = import("@/lib/theme/appearance-types").ColorPresetChoice;

export {
  chromeHasNeonChrome,
  chromeUsesScanlines,
} from "@/lib/theme/chrome-behavior";

export function useTheme() {
  const { theme, setTheme, resolvedTheme, toggleThemeLightDark, isDark } =
    useColorScheme();
  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme: toggleThemeLightDark,
    isDark,
  };
}
