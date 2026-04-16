"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export type ColorScheme = "default" | "calm-storm" | "cyberpunk" | "bubblegum" | "caffeine" | "darkmatter" | "holoterminal";
export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
export type ChromeMode = "calm" | "expressive";
export type ChromePreference = "auto" | "calm" | "expressive";

const VALID_CHROME_PREFERENCES: ChromePreference[] = ["auto", "calm", "expressive"];

const COLOR_SCHEME_CHROME_MAP: Record<ColorScheme, ChromeMode> = {
  default: "calm",
  "calm-storm": "calm",
  cyberpunk: "expressive",
  bubblegum: "expressive",
  caffeine: "expressive",
  darkmatter: "expressive",
  holoterminal: "expressive",
};

export const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: "holoterminal", label: "Holoterminal" },
  { value: "default", label: "Default" },
  { value: "calm-storm", label: "Calm Storm" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "bubblegum", label: "Bubblegum" },
  { value: "caffeine", label: "Caffeine" },
  { value: "darkmatter", label: "Darkmatter" },
];

const DEFAULT_COLOR_SCHEME: ColorScheme = "holoterminal";
const VALID_COLOR_SCHEMES: ColorScheme[] = [
  "holoterminal",
  "calm-storm",
  "cyberpunk",
  "bubblegum",
  "caffeine",
  "darkmatter",
  "default",
];
const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";

interface ColorSchemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  chromePreference: ChromePreference;
  setChromePreference: (pref: ChromePreference) => void;
  chromeMode: ChromeMode;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  isDark: boolean;
  mounted: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function normalizeColorScheme(value: string | null | undefined): ColorScheme | null {
  if (value && VALID_COLOR_SCHEMES.includes(value as ColorScheme)) {
    return value as ColorScheme;
  }
  return null;
}

function normalizeChromePreference(value: string | null | undefined): ChromePreference {
  if (value && VALID_CHROME_PREFERENCES.includes(value as ChromePreference)) {
    return value as ChromePreference;
  }
  return "auto";
}

function normalizeThemePreference(value: string | null | undefined): ThemePreference | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return null;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyColorScheme(scheme: ColorScheme) {
  if (typeof document === "undefined") return;
  if (scheme === "default") {
    document.documentElement.removeAttribute("data-color-scheme");
  } else {
    document.documentElement.setAttribute("data-color-scheme", scheme);
  }
}

function applyChrome(mode: ChromeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-chrome", mode);
}

function applyResolvedTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const session = useQuery(api.sessions.getSession, isAuthenticated ? {} : "skip");
  const updateSession = useMutation(api.sessions.updateSession);

  const colorScheme = normalizeColorScheme(session?.colorScheme) ?? DEFAULT_COLOR_SCHEME;
  const chromePreference = normalizeChromePreference(session?.chromePreference);
  const effectiveChrome: ChromeMode =
    chromePreference === "calm" || chromePreference === "expressive"
      ? chromePreference
      : COLOR_SCHEME_CHROME_MAP[colorScheme];
  const theme = normalizeThemePreference(session?.theme) ?? DEFAULT_THEME_PREFERENCE;
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";
  const mounted = true;

  useEffect(() => {
    applyColorScheme(colorScheme);
    applyChrome(effectiveChrome);
  }, [colorScheme, effectiveChrome]);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    if (!isAuthenticated || authLoading) {
      return;
    }
    if (scheme === colorScheme) {
      return;
    }
    void updateSession({
      colorScheme: scheme,
    });
  }, [isAuthenticated, authLoading, colorScheme, updateSession]);

  const setChromePreference = useCallback((pref: ChromePreference) => {
    if (!isAuthenticated || authLoading) {
      return;
    }
    if (pref === chromePreference) {
      return;
    }
    void updateSession({
      chromePreference: pref,
    });
  }, [isAuthenticated, authLoading, chromePreference, updateSession]);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    if (!isAuthenticated || authLoading) {
      return;
    }
    if (nextTheme === theme) {
      return;
    }
    void updateSession({
      theme: nextTheme,
    });
  }, [isAuthenticated, authLoading, theme, updateSession]);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemePreference = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ColorSchemeContextValue>(() => ({
    colorScheme,
    setColorScheme,
    chromePreference,
    setChromePreference,
    chromeMode: effectiveChrome,
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    isDark,
    mounted,
  }), [colorScheme, setColorScheme, chromePreference, setChromePreference, effectiveChrome, theme, setTheme, resolvedTheme, toggleTheme, isDark, mounted]);

  return (
    <ColorSchemeContext.Provider value={value}>
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

export function useChromeMode(): ChromeMode {
  const context = useContext(ColorSchemeContext);
  if (!context) return "calm";
  return context.chromeMode;
}
