"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  CHROME_VARIANT_VALUES,
  COLOR_PRESET_VALUES,
  type ChromeVariant,
  type ColorPresetChoice,
} from "@/lib/theme/appearance-types";
import type { CatalogAppearance, CatalogOverride } from "./params";

/**
 * Read-only view of the appearance attributes on `<html>`, whoever wrote them (the app's
 * ColorSchemeProvider, this catalog, or a capture tool's pin). Observing never writes back, so the
 * catalog can't get into a re-apply loop with another writer.
 */

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeRoot(listener: () => void): () => void {
  listeners.add(listener);
  if (!observer && typeof document !== "undefined") {
    observer = new MutationObserver(notify);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-color-theme", "data-chrome"],
    });
    // Custom palettes inject a <style> into <head>; token values change without an attribute change.
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

export const SERVER_APPEARANCE: CatalogAppearance = { theme: "default", mode: "light", chrome: "calm" };

function readRootKey(): string {
  const root = document.documentElement;
  const theme = root.getAttribute("data-color-theme") ?? "";
  const chrome = root.getAttribute("data-chrome") ?? "";
  return `${theme}|${root.classList.contains("dark") ? "dark" : "light"}|${chrome}`;
}

function toAppearance(key: string): CatalogAppearance & { rawTheme: string } {
  const [theme, mode, chrome] = key.split("|");
  return {
    rawTheme: theme,
    theme: (COLOR_PRESET_VALUES as readonly string[]).includes(theme)
      ? (theme as ColorPresetChoice)
      : SERVER_APPEARANCE.theme,
    mode: mode === "dark" ? "dark" : "light",
    chrome: (CHROME_VARIANT_VALUES as readonly string[]).includes(chrome)
      ? (chrome as ChromeVariant)
      : SERVER_APPEARANCE.chrome,
  };
}

/** What `<html>` shows right now. `rawTheme` is `custom` for a user's custom palette. */
export function useRootAppearance(serverFallback: CatalogOverride = {}) {
  const serverKey = `${serverFallback.theme ?? SERVER_APPEARANCE.theme}|${serverFallback.mode ?? SERVER_APPEARANCE.mode}|${serverFallback.chrome ?? SERVER_APPEARANCE.chrome}`;
  const key = useSyncExternalStore(subscribeRoot, readRootKey, () => serverKey);
  return useMemo(() => ({ key, ...toAppearance(key) }), [key]);
}

/**
 * Re-reads `read()` whenever the root appearance changes. `read` must return a string so React
 * can compare snapshots by value. It may read refs: React re-checks the snapshot after mount.
 */
export function useRootSnapshot(read: () => string, serverValue = ""): string {
  return useSyncExternalStore(subscribeRoot, read, () => serverValue);
}

export function readRootToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
