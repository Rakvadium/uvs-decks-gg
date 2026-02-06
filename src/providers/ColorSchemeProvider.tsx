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
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(DEFAULT_COLOR_SCHEME);
  const lastPersistedRef = useRef<string | null>(null);
  const themeRef = useRef<ThemePreference | null>(null);
  const colorSchemeRef = useRef<ColorScheme>(DEFAULT_COLOR_SCHEME);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const session = useQuery(api.sessions.getSession, isAuthenticated ? {} : "skip");
  const updateSession = useMutation(api.sessions.updateSession);
  const isSessionLoaded = session !== undefined;
  const sessionTheme = session?.theme;
  const sessionColorScheme = session?.colorScheme;
  const mounted = true;

  useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    colorSchemeRef.current = colorScheme;
  }, [colorScheme]);

  useEffect(() => {
    themeRef.current = normalizeThemePreference(theme) ?? normalizeThemePreference(resolvedTheme);
  }, [theme, resolvedTheme]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      lastPersistedRef.current = null;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || authLoading || !isSessionLoaded) {
      return;
    }

    const serverTheme = normalizeThemePreference(sessionTheme);
    const serverColorScheme = normalizeColorScheme(sessionColorScheme) ?? DEFAULT_COLOR_SCHEME;
    if (serverTheme && themeRef.current !== serverTheme) {
      setTheme(serverTheme);
    }
    if (colorSchemeRef.current !== serverColorScheme) {
      queueMicrotask(() => setColorScheme(serverColorScheme));
    }
    lastPersistedRef.current = serverTheme ? `${serverTheme}|${serverColorScheme}` : null;
  }, [isAuthenticated, authLoading, isSessionLoaded, sessionTheme, sessionColorScheme, setTheme, setColorScheme]);

  useEffect(() => {
    if (!isAuthenticated || authLoading || !isSessionLoaded) {
      return;
    }

    const normalizedTheme = normalizeThemePreference(theme) ?? normalizeThemePreference(resolvedTheme);
    if (!normalizedTheme) {
      return;
    }

    const persistenceKey = `${normalizedTheme}|${colorScheme}`;
    const serverTheme = normalizeThemePreference(sessionTheme);
    const serverColorScheme = normalizeColorScheme(sessionColorScheme);
    if (serverTheme && serverColorScheme && persistenceKey === `${serverTheme}|${serverColorScheme}`) {
      lastPersistedRef.current = persistenceKey;
      return;
    }

    if (lastPersistedRef.current === persistenceKey) {
      return;
    }

    lastPersistedRef.current = persistenceKey;
    void updateSession({
      theme: normalizedTheme,
      colorScheme,
    });
  }, [isAuthenticated, authLoading, isSessionLoaded, sessionTheme, sessionColorScheme, theme, resolvedTheme, colorScheme, updateSession]);

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
