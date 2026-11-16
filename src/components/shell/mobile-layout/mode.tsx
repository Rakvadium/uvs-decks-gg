"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Mobile chrome layout. `pannu` (labeled tabs with the action button in the nav, a per-page action
 * bar, the tools pill) is the only layout offered. `menu` and `classic` (the previous icon tab bar)
 * stay in the code as a fallback but appear nowhere in the UI: reach them with
 * `?mobile-layout=menu|classic` (and `?mobile-layout=pannu` to come back). That choice persists.
 * To make Classic the default again, change `DEFAULT_MODE`.
 */
export type MobileLayoutMode = "classic" | "menu" | "pannu";

const DEFAULT_MODE: MobileLayoutMode = "pannu";

/** v2: choices saved while layouts were user-selectable are ignored, so everyone starts on Pannu. */
const STORAGE_KEY = "tcgdecks:mobile-layout-v2";
const QUERY_KEY = "mobile-layout";

function parseMode(value: string | null | undefined): MobileLayoutMode | null {
  return value === "classic" || value === "menu" || value === "pannu" ? value : null;
}

function readQueryMode(): MobileLayoutMode | null {
  if (typeof window === "undefined") return null;
  return parseMode(new URLSearchParams(window.location.search).get(QUERY_KEY));
}

function readStoredMode(): MobileLayoutMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    return parseMode(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function writeStoredMode(mode: MobileLayoutMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only.
  }
}

interface MobileLayoutModeValue {
  mode: MobileLayoutMode;
  setMode: (mode: MobileLayoutMode) => void;
}

const MobileLayoutModeContext = createContext<MobileLayoutModeValue | null>(null);

export function MobileLayoutModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<MobileLayoutMode>(() => readQueryMode() ?? readStoredMode());

  useEffect(() => {
    const fromQuery = readQueryMode();
    if (fromQuery) writeStoredMode(fromQuery);
  }, []);

  const setMode = useCallback((next: MobileLayoutMode) => {
    writeStoredMode(next);
    setModeState(next);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <MobileLayoutModeContext.Provider value={value}>{children}</MobileLayoutModeContext.Provider>;
}

export function useMobileLayoutMode(): MobileLayoutModeValue {
  const context = useContext(MobileLayoutModeContext);
  if (!context) {
    throw new Error("useMobileLayoutMode must be used within MobileLayoutModeProvider");
  }
  return context;
}

/** For page code that also renders on desktop, where no mobile shell (and so no mode) exists. */
export function useMobileLayoutModeOptional(): MobileLayoutMode | null {
  return useContext(MobileLayoutModeContext)?.mode ?? null;
}

/** Menu and Pannu share the action menu, the tools pill and the header avatar. */
export function usesMenuChrome(mode: MobileLayoutMode | null): boolean {
  return mode === "menu" || mode === "pannu";
}
