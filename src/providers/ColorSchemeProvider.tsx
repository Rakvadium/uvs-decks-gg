"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { PersistedColorSource } from "@/lib/theme/appearance-types";
import {
  CHROME_VARIANT_VALUES,
  COLOR_PRESET_VALUES,
  DEFAULT_CUSTOM_BRAND,
  type ChromeVariant,
  type ColorPresetChoice,
  type ThemePreference,
  type AppearanceCustom,
  type AppearanceModePair,
} from "@/lib/theme/appearance-types";
import { buildSemanticCssVars } from "@/lib/theme/generateSemanticCssVars";
import { resolveAppearanceCustomPair } from "@/lib/theme/resolve-appearance-custom";

type ResolvedTheme = "light" | "dark";

const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";
const DEFAULT_CHROME: ChromeVariant = "calm";
const DEFAULT_COLOR_SOURCE: PersistedColorSource = { kind: "preset", preset: "default" };

const CUSTOM_STYLE_EL_ID = "appearance-custom-vars";

export const COLOR_PRESET_OPTIONS: { id: ColorPresetChoice; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "calm-storm", label: "Calm Storm" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "cotton-candy", label: "Cotton Candy" },
  { id: "caffeine", label: "Caffeine" },
  { id: "aurora", label: "Aurora" },
  { id: "sorbet", label: "Sorbet" },
  { id: "singularity", label: "Singularity" },
];

export const COLOR_SCHEMES = COLOR_PRESET_OPTIONS.map((row) => ({
  value: row.id,
  label: row.label,
}));

export const CHROME_OPTIONS: { id: ChromeVariant; label: string; description: string }[] = [
  { id: "calm", label: "Calm", description: "Flat surfaces, neutral depth, understated motion." },
  { id: "expressive", label: "Expressive", description: "Strong glow depth, kinetic accents, display headings." },
  { id: "holoterminal", label: "Holoterminal", description: "Tight neon radius, holographic ambience, holo-friendly frames." },
  { id: "bubblegum", label: "Bubblegum", description: "Squared radius, chunky offset shadows, playful solidity." },
  { id: "darkmatter", label: "Dark Matter", description: "Soft capsules, subdued gravity, restrained elevation." },
];

function isColorPresetChoice(v: string): v is ColorPresetChoice {
  return (COLOR_PRESET_VALUES as readonly string[]).includes(v);
}

function isChromeVariant(v: string): v is ChromeVariant {
  return (CHROME_VARIANT_VALUES as readonly string[]).includes(v);
}

export function normalizePersistedColorSource(value: unknown): PersistedColorSource {
  if (value === null || value === undefined) {
    return DEFAULT_COLOR_SOURCE;
  }
  if (typeof value === "object" && value !== null && "kind" in value) {
    const obj = value as { kind?: string; preset?: string; custom?: AppearanceCustom };
    if (obj.kind === "preset" && typeof obj.preset === "string" && isColorPresetChoice(obj.preset)) {
      return { kind: "preset", preset: obj.preset };
    }
    if (obj.kind === "custom" && obj.custom?.fallback?.light?.primary !== undefined) {
      return { kind: "custom", custom: obj.custom as AppearanceCustom };
    }
  }
  return DEFAULT_COLOR_SOURCE;
}

function normalizeChrome(value: unknown): ChromeVariant {
  if (typeof value === "string" && isChromeVariant(value)) {
    return value;
  }
  return DEFAULT_CHROME;
}

function normalizeThemePreference(value: string | undefined | null): ThemePreference | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return null;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function serializeVars(vars: Record<string, string>) {
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join("");
}

function mountCustomAppearanceStyle(css: string) {
  if (typeof document === "undefined") return;
  let node = document.getElementById(CUSTOM_STYLE_EL_ID);
  if (!node) {
    node = document.createElement("style");
    node.id = CUSTOM_STYLE_EL_ID;
    document.head.appendChild(node);
  }
  node.textContent = css;
}

function clearCustomAppearanceStyle() {
  if (typeof document === "undefined") return;
  const node = document.getElementById(CUSTOM_STYLE_EL_ID);
  if (node) {
    node.textContent = "";
  }
}

interface ColorSchemeContextValue {
  colorPreset: ColorPresetChoice | null;
  isCustomAppearance: boolean;
  colorSource: PersistedColorSource;
  setAppearancePreset: (preset: ColorPresetChoice) => void;
  setAppearanceCustom: (custom: AppearanceCustom) => void;
  touchAppearanceCustom: (target: AppearanceCustom | ((draft: AppearanceCustom) => AppearanceCustom)) => void;
  chrome: ChromeVariant;
  setChrome: (next: ChromeVariant) => void;
  theme: ThemePreference;
  setTheme: (next: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
  toggleThemeLightDark: () => void;
  isDark: boolean;
  mounted: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function themeAttributeValue(source: PersistedColorSource): string {
  return source.kind === "custom" ? "custom" : source.preset;
}

function resolveCustomCss(custom: AppearanceCustom, chrome: ChromeVariant): string {
  const resolved = resolveAppearanceCustomPair(custom, chrome);
  const lightVars = buildSemanticCssVars(
    resolved.light.primary,
    resolved.light.secondary,
    "light",
  );
  const darkVars = buildSemanticCssVars(
    resolved.dark.primary,
    resolved.dark.secondary,
    "dark",
  );
  return `
html.dark[data-color-theme="custom"] { ${serializeVars(darkVars)} }
html[data-color-theme="custom"]:where(:not(.dark)) { ${serializeVars(lightVars)} }
`;
}

function cloneAppearanceCustom(custom: AppearanceCustom): AppearanceCustom {
  let byChrome: AppearanceCustom["byChrome"];
  if (custom.byChrome) {
    const cloned = Object.fromEntries(
      (
        Object.entries(custom.byChrome) as [
          ChromeVariant,
          AppearanceModePair | undefined,
        ][]
      )
        .filter((entry): entry is [ChromeVariant, AppearanceModePair] => entry[1] !== undefined)
        .map(([key, pair]) => [
          key,
          {
            light: { primary: pair.light.primary, secondary: pair.light.secondary },
            dark: { primary: pair.dark.primary, secondary: pair.dark.secondary },
          },
        ]),
    ) as NonNullable<AppearanceCustom["byChrome"]>;
    byChrome = Object.keys(cloned).length > 0 ? cloned : undefined;
  }
  return {
    fallback: {
      light: {
        primary: custom.fallback.light.primary,
        secondary: custom.fallback.light.secondary,
      },
      dark: {
        primary: custom.fallback.dark.primary,
        secondary: custom.fallback.dark.secondary,
      },
    },
    byChrome,
  };
}

function mergeDraftCustom(
  current: PersistedColorSource,
  updater: AppearanceCustom | ((draft: AppearanceCustom) => AppearanceCustom),
): AppearanceCustom {
  const base =
    current.kind === "custom"
      ? cloneAppearanceCustom(current.custom)
      : {
          fallback: DEFAULT_CUSTOM_BRAND,
          byChrome: undefined as AppearanceCustom["byChrome"],
        };
  const nextDraft = typeof updater === "function" ? updater(base) : updater;
  return cloneAppearanceCustom(nextDraft);
}

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const session = useQuery(api.sessions.getSession, isAuthenticated ? {} : "skip");
  const updateSession = useMutation(api.sessions.updateSession);
  const ensureMigrated = useMutation(api.sessions.ensureAppearanceMigrated);

  const [guestTheme, setGuestTheme] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      void ensureMigrated({});
    }
  }, [ensureMigrated, isAuthenticated, authLoading]);

  const sessionTheme = normalizeThemePreference(session?.theme);
  const theme: ThemePreference =
    isAuthenticated && !authLoading
      ? (sessionTheme ?? DEFAULT_THEME_PREFERENCE)
      : guestTheme;
  const chrome = normalizeChrome(session?.chrome);
  const colorSource = normalizePersistedColorSource(session?.colorSource);

  const presetFromSource = colorSource.kind === "preset" ? colorSource.preset : null;

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";
  const effectivePresetAttr = themeAttributeValue(colorSource);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-color-theme", effectivePresetAttr);
  }, [effectivePresetAttr]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-chrome", chrome);
  }, [chrome]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme === "dark" ? "dark" : "light";
  }, [resolvedTheme]);

  useEffect(() => {
    if (colorSource.kind !== "custom") {
      clearCustomAppearanceStyle();
      return;
    }
    try {
      mountCustomAppearanceStyle(resolveCustomCss(colorSource.custom, chrome));
    } catch {
      clearCustomAppearanceStyle();
    }
    return () => clearCustomAppearanceStyle();
  }, [chrome, colorSource]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setAppearancePreset = useCallback(
    async (preset: ColorPresetChoice) => {
      if (!isAuthenticated || authLoading) return;
      await updateSession({
        colorSource: { kind: "preset", preset },
      });
    },
    [authLoading, isAuthenticated, updateSession],
  );

  const setAppearanceCustom = useCallback(
    async (custom: AppearanceCustom) => {
      if (!isAuthenticated || authLoading) return;
      await updateSession({
        colorSource: { kind: "custom", custom },
      });
    },
    [authLoading, isAuthenticated, updateSession],
  );

  const patchAppearanceCustomDraft = useCallback(
    async (updater: AppearanceCustom | ((draft: AppearanceCustom) => AppearanceCustom)) => {
      if (!isAuthenticated || authLoading) return;
      const next = mergeDraftCustom(colorSource, updater);
      await updateSession({
        colorSource: { kind: "custom", custom: next },
      });
    },
    [authLoading, colorSource, isAuthenticated, updateSession],
  );

  const setChromeMut = useCallback(
    async (next: ChromeVariant) => {
      if (!isAuthenticated || authLoading) return;
      if (next === chrome) return;
      await updateSession({ chrome: next });
    },
    [authLoading, chrome, isAuthenticated, updateSession],
  );

  const setThemePreference = useCallback(
    (nextTheme: ThemePreference) => {
      if (!isAuthenticated || authLoading) {
        setGuestTheme((t) => (t === nextTheme ? t : nextTheme));
        return;
      }
      if (nextTheme === theme) return;
      void updateSession({ theme: nextTheme });
    },
    [authLoading, isAuthenticated, theme, updateSession],
  );

  const toggleThemeLightDark = useCallback(() => {
    const locked: ResolvedTheme = resolvedTheme === "dark" ? "light" : "dark";
    setThemePreference(locked);
  }, [resolvedTheme, setThemePreference]);

  const value = useMemo<ColorSchemeContextValue>(
    () => ({
      colorPreset: presetFromSource,
      isCustomAppearance: colorSource.kind === "custom",
      colorSource,
      setAppearancePreset: (preset) => void setAppearancePreset(preset),
      setAppearanceCustom: (custom) => void setAppearanceCustom(custom),
      touchAppearanceCustom: (updater) => void patchAppearanceCustomDraft(updater),
      chrome,
      setChrome: (next) => void setChromeMut(next),
      theme,
      setTheme: setThemePreference,
      resolvedTheme,
      toggleThemeLightDark,
      isDark,
      mounted: true,
    }),
    [
      chrome,
      colorSource,
      isDark,
      patchAppearanceCustomDraft,
      presetFromSource,
      resolvedTheme,
      setAppearanceCustom,
      setAppearancePreset,
      setChromeMut,
      setThemePreference,
      theme,
      toggleThemeLightDark,
    ],
  );

  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
}

export function useColorScheme() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error("useColorScheme must be used within a ColorSchemeProvider");
  }
  return context;
}

export function useChromeVariant(): ChromeVariant {
  const context = useContext(ColorSchemeContext);
  return context?.chrome ?? DEFAULT_CHROME;
}

export function useChromeMode(): ChromeVariant {
  return useChromeVariant();
}

export type ChromeMode = ChromeVariant;
