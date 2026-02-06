"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTheme as useNextTheme } from "next-themes";
import { api } from "../../convex/_generated/api";

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
const VALID_COLOR_SCHEMES: ColorScheme[] = [
  "holoterminal",
  "calm-storm",
  "cyberpunk",
  "bubblegum",
  "caffeine",
  "darkmatter",
  "default",
];

type ThemePreference = "light" | "dark" | "system";

interface ColorSchemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  mounted: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function getStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") return DEFAULT_COLOR_SCHEME;
  const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  if (stored && VALID_COLOR_SCHEMES.includes(stored as ColorScheme)) {
    return stored as ColorScheme;
  }
  return DEFAULT_COLOR_SCHEME;
}

function normalizeThemePreference(value: string | null | undefined): ThemePreference | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return null;
}

function normalizeColorScheme(value: string | null | undefined): ColorScheme | null {
  if (value && VALID_COLOR_SCHEMES.includes(value as ColorScheme)) {
    return value as ColorScheme;
  }
  return null;
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
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => getStoredColorScheme());
  const hasSyncedFromServerRef = useRef(false);
  const lastPersistedRef = useRef<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const session = useQuery(api.sessions.getSession, isAuthenticated ? {} : "skip");
  const updateSession = useMutation(api.sessions.updateSession);
  const mounted = true;

  useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedFromServerRef.current = false;
      lastPersistedRef.current = null;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || authLoading || session === undefined || hasSyncedFromServerRef.current) {
      return;
    }

    hasSyncedFromServerRef.current = true;
    const initialTheme = normalizeThemePreference(theme) ?? normalizeThemePreference(resolvedTheme) ?? "dark";
    lastPersistedRef.current = `${initialTheme}|${colorScheme}`;

    const serverTheme = normalizeThemePreference(session?.theme);
    const serverColorScheme = normalizeColorScheme(session?.colorScheme);

    if (serverTheme && serverTheme !== theme) {
      setTheme(serverTheme);
    }

    let effectiveColorScheme = colorScheme;
    if (serverColorScheme && serverColorScheme !== colorScheme) {
      queueMicrotask(() => setColorScheme(serverColorScheme));
      effectiveColorScheme = serverColorScheme;
    }

    const localTheme = normalizeThemePreference(theme) ?? normalizeThemePreference(resolvedTheme) ?? "dark";
    const effectiveTheme = serverTheme ?? localTheme;

    if (!serverTheme || !serverColorScheme) {
      lastPersistedRef.current = `${effectiveTheme}|${effectiveColorScheme}`;
      void updateSession({
        theme: effectiveTheme,
        colorScheme: effectiveColorScheme,
      });
      return;
    }
  }, [
    isAuthenticated,
    authLoading,
    session,
    theme,
    resolvedTheme,
    setTheme,
    colorScheme,
    setColorScheme,
    updateSession,
  ]);

  useEffect(() => {
    if (!isAuthenticated || authLoading || session === undefined || !hasSyncedFromServerRef.current) {
      return;
    }

    const normalizedTheme = normalizeThemePreference(theme) ?? normalizeThemePreference(resolvedTheme);
    if (!normalizedTheme) {
      return;
    }

    const persistenceKey = `${normalizedTheme}|${colorScheme}`;
    if (lastPersistedRef.current === persistenceKey) {
      return;
    }

    lastPersistedRef.current = persistenceKey;
    void updateSession({
      theme: normalizedTheme,
      colorScheme,
    });
  }, [isAuthenticated, authLoading, session, theme, resolvedTheme, colorScheme, updateSession]);

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
