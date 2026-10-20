"use client";

import { useSyncExternalStore } from "react";

// The exact complement of Tailwind's `md:` query (`width >= 48rem`, 768px at the default root font
// size), so JS and CSS agree at fractional widths and with a non-default browser font size too.
export const MOBILE_MEDIA_QUERY = "(width < 48rem)";
const BELOW_LG_MEDIA_QUERY = "(max-width: 1023px)";

function getServerSnapshot(): boolean {
  return false;
}

function createMediaStore(query: string) {
  function getSnapshot(): boolean {
    return window.matchMedia(query).matches;
  }

  function subscribe(onStoreChange: () => void): () => void {
    const mql = window.matchMedia(query);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    }
    mql.addListener(onStoreChange);
    return () => mql.removeListener(onStoreChange);
  }

  return { getSnapshot, subscribe };
}

export const mobileViewportStore = createMediaStore(MOBILE_MEDIA_QUERY);
const belowLgStore = createMediaStore(BELOW_LG_MEDIA_QUERY);

export function useIsMobile(): boolean {
  return useSyncExternalStore(mobileViewportStore.subscribe, mobileViewportStore.getSnapshot, getServerSnapshot);
}

export function useIsBelowLg(): boolean {
  return useSyncExternalStore(belowLgStore.subscribe, belowLgStore.getSnapshot, getServerSnapshot);
}
