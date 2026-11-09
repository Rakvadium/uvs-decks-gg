"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useColorScheme } from "@/providers/ColorSchemeProvider";
import { useRootAppearance } from "./root-store";
import {
  hasOverride,
  writeCatalogOverride,
  type CatalogAppearance,
  type CatalogOverride,
} from "./params";

/**
 * Page-scoped appearance for `/design`.
 *
 * - Writes only `<html>` attributes, and only for axes the catalog pins. It reads the app's
 *   ColorSchemeProvider values but never calls its setters, so nothing reaches Convex.
 * - Re-pins after the provider's own effects run (a microtask after the same passive-effect flush),
 *   e.g. when a signed-in session loads. It never observes-and-reapplies, so a second writer (like
 *   the capture tool's pin) wins quietly instead of looping.
 * - Restores the provider's values on reset and when the page unmounts.
 */

interface AppValues {
  themeAttr: string;
  chrome: string;
  dark: boolean;
}

function applyToRoot(override: CatalogOverride) {
  const root = document.documentElement;
  if (override.theme && root.getAttribute("data-color-theme") !== override.theme) {
    root.setAttribute("data-color-theme", override.theme);
  }
  if (override.chrome && root.getAttribute("data-chrome") !== override.chrome) {
    root.setAttribute("data-chrome", override.chrome);
  }
  if (override.mode) {
    const dark = override.mode === "dark";
    if (root.classList.contains("dark") !== dark) root.classList.toggle("dark", dark);
    if (root.style.colorScheme !== override.mode) root.style.colorScheme = override.mode;
  }
}

function restoreRoot(app: AppValues) {
  const root = document.documentElement;
  root.setAttribute("data-color-theme", app.themeAttr);
  root.setAttribute("data-chrome", app.chrome);
  root.classList.toggle("dark", app.dark);
  root.style.colorScheme = app.dark ? "dark" : "light";
}

interface CatalogAppearanceValue {
  /** What `<html>` shows now (the source of truth for every readout on the page). */
  current: CatalogAppearance & { rawTheme: string; key: string };
  /** Axes pinned by the catalog (URL), empty when the page follows the app. */
  override: CatalogOverride;
  pinned: boolean;
  set: (patch: Partial<CatalogAppearance>) => void;
  reset: () => void;
  /** Chapter shown on its own (`?focus=`), or null for the whole catalog. */
  focus: string | null;
  setFocus: (focus: string | null) => void;
  /** A `/design` href for the current pins and focus, with `patch` applied. */
  hrefWith: (patch: { focus?: string | null } & Partial<CatalogAppearance>) => string;
}

const CatalogAppearanceContext = createContext<CatalogAppearanceValue | null>(null);

function catalogSearch(override: CatalogOverride, focus: string | null, base = new URLSearchParams()) {
  const params = writeCatalogOverride(base, override);
  if (focus) params.set("focus", focus);
  else params.delete("focus");
  return params;
}

export function CatalogAppearanceProvider({
  initialOverride,
  initialFocus,
  children,
}: {
  initialOverride: CatalogOverride;
  initialFocus: string | null;
  children: ReactNode;
}) {
  const app = useColorScheme();
  const appValues = useMemo<AppValues>(
    () => ({
      themeAttr: app.colorSource.kind === "custom" ? "custom" : app.colorSource.preset,
      chrome: app.chrome,
      dark: app.resolvedTheme === "dark",
    }),
    [app.colorSource, app.chrome, app.resolvedTheme],
  );
  const [override, setOverride] = useState<CatalogOverride>(initialOverride);
  const [focus, setFocusState] = useState<string | null>(initialFocus);
  const root = useRootAppearance(initialOverride);

  const appRef = useRef(appValues);
  const appliedRef = useRef(false);
  useEffect(() => {
    appRef.current = appValues;
  }, [appValues]);

  useEffect(() => {
    if (!hasOverride(override)) {
      if (appliedRef.current) restoreRoot(appValues);
      appliedRef.current = false;
      return;
    }
    let cancelled = false;
    // After ColorSchemeProvider's effects from this same commit have written its values.
    queueMicrotask(() => {
      if (cancelled) return;
      applyToRoot(override);
      appliedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [override, appValues]);

  useEffect(
    () => () => {
      if (appliedRef.current) restoreRoot(appRef.current);
    },
    [],
  );

  // Search params are written with replaceState (no navigation), so the server page never
  // re-renders on the client and theme switching stays instant.
  const writeUrl = useCallback((nextOverride: CatalogOverride, nextFocus: string | null) => {
    const url = new URL(window.location.href);
    url.search = catalogSearch(nextOverride, nextFocus, url.searchParams).toString();
    window.history.replaceState(null, "", url);
  }, []);

  const set = useCallback(
    (patch: Partial<CatalogAppearance>) => {
      const next = { ...override, ...patch };
      setOverride(next);
      writeUrl(next, focus);
    },
    [focus, override, writeUrl],
  );
  const reset = useCallback(() => {
    setOverride({});
    writeUrl({}, focus);
  }, [focus, writeUrl]);

  const setFocus = useCallback(
    (next: string | null) => {
      setFocusState(next);
      writeUrl(override, next);
    },
    [override, writeUrl],
  );

  const hrefWith = useCallback(
    ({ focus: focusPatch, ...appearancePatch }: { focus?: string | null } & Partial<CatalogAppearance>) => {
      const query = catalogSearch(
        { ...override, ...appearancePatch },
        focusPatch === undefined ? focus : focusPatch,
      ).toString();
      return query ? `/design?${query}` : "/design";
    },
    [focus, override],
  );

  const value = useMemo<CatalogAppearanceValue>(
    () => ({
      current: root,
      override,
      pinned: hasOverride(override),
      set,
      reset,
      focus,
      setFocus,
      hrefWith,
    }),
    [root, override, set, reset, focus, setFocus, hrefWith],
  );

  return <CatalogAppearanceContext.Provider value={value}>{children}</CatalogAppearanceContext.Provider>;
}

export function useCatalogAppearance(): CatalogAppearanceValue {
  const value = useContext(CatalogAppearanceContext);
  if (!value) throw new Error("useCatalogAppearance must be used inside CatalogAppearanceProvider");
  return value;
}
