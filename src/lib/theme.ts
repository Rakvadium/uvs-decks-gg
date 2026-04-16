"use client";

export { useColorScheme, useChromeMode, COLOR_SCHEMES, ColorSchemeProvider } from "@/providers/ColorSchemeProvider";
export type { ColorScheme, ThemePreference, ChromePreference, ChromeMode } from "@/providers/ColorSchemeProvider";
import { useColorScheme } from "@/providers/ColorSchemeProvider";

export function useTheme() {
  const { theme, setTheme, resolvedTheme, toggleTheme, isDark } = useColorScheme();
  return { theme, setTheme, resolvedTheme, toggleTheme, isDark };
}
