"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";

export type ColorScheme = "default" | "calm-storm" | "cyberpunk" | "bubblegum" | "caffeine" | "darkmatter" | "holoterminal";

export const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: "holoterminal", label: "Holoterminal" },
  { value: "default", label: "Default" },
  { value: "calm-storm", label: "Calm Storm" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "bubblegum", label: "Bubblegum" },
  { value: "caffeine", label: "Caffeine" },
  { value: "darkmatter", label: "Darkmatter" },
];

const COLOR_SCHEME_STORAGE_KEY = "color-scheme";
const DEFAULT_COLOR_SCHEME: ColorScheme = "holoterminal";

interface ColorSchemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  mounted: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function getStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") return DEFAULT_COLOR_SCHEME;
  const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  const validSchemes: ColorScheme[] = ["holoterminal", "calm-storm", "cyberpunk", "bubblegum", "caffeine", "darkmatter", "default"];
  if (stored && validSchemes.includes(stored as ColorScheme)) {
    return stored as ColorScheme;
  }
  return DEFAULT_COLOR_SCHEME;
}

function applyColorScheme(scheme: ColorScheme) {
  if (typeof document === "undefined") return;
  if (scheme === "default") {
    document.documentElement.removeAttribute("data-color-scheme");
  } else {
    document.documentElement.setAttribute("data-color-scheme", scheme);
  }
}

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(DEFAULT_COLOR_SCHEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredColorScheme();
    setColorSchemeState(stored);
    applyColorScheme(stored);
    setMounted(true);
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
    applyColorScheme(scheme);
  }, []);

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme, mounted }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error("useColorScheme must be used within a ColorSchemeProvider");
  }
  return context;
}
