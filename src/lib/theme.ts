"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

export type ColorScheme = "default" | "calm-storm" | "cyberpunk" | "bubblegum" | "caffeine" | "darkmatter" | "holoterminal";

export const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "calm-storm", label: "Calm Storm" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "bubblegum", label: "Bubblegum" },
  { value: "caffeine", label: "Caffeine" },
  { value: "darkmatter", label: "Darkmatter" },
  { value: "holoterminal", label: "Holoterminal" },
];

const COLOR_SCHEME_STORAGE_KEY = "color-scheme";

function getStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") return "default";
  const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  if (stored === "calm-storm") return "calm-storm";
  if (stored === "cyberpunk") return "cyberpunk";
  if (stored === "bubblegum") return "bubblegum";
  if (stored === "caffeine") return "caffeine";
  if (stored === "darkmatter") return "darkmatter";
  if (stored === "holoterminal") return "holoterminal";
  return "default";
}

function applyColorScheme(scheme: ColorScheme) {
  if (typeof document === "undefined") return;
  if (scheme === "default") {
    document.documentElement.removeAttribute("data-color-scheme");
  } else {
    document.documentElement.setAttribute("data-color-scheme", scheme);
  }
}

export function useColorScheme() {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredColorScheme();
    setColorSchemeState(stored);
    applyColorScheme(stored);
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
    applyColorScheme(scheme);
  }, []);

  return {
    colorScheme: mounted ? colorScheme : "default",
    setColorScheme,
    mounted,
  };
}

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
