"use client";

import { createContext, useContext, useCallback, useEffect, ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
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

interface ColorSchemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  mounted: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

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
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const session = useQuery(api.sessions.getSession, isAuthenticated ? {} : "skip");
  const updateSession = useMutation(api.sessions.updateSession);
  const colorScheme = normalizeColorScheme(session?.colorScheme) ?? DEFAULT_COLOR_SCHEME;
  const mounted = true;

  useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

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
