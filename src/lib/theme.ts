"use client";

import { useTheme as useNextTheme } from "next-themes";

export { useColorScheme, COLOR_SCHEMES, ColorSchemeProvider } from "@/providers/ColorSchemeProvider";
export type { ColorScheme } from "@/providers/ColorSchemeProvider";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDark = resolvedTheme === "dark";

  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    isDark,
  };
}
