"use client";

import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
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

const mobileStore = createMediaStore(MOBILE_MEDIA_QUERY);
const belowLgStore = createMediaStore(BELOW_LG_MEDIA_QUERY);

export function useIsMobile(): boolean {
  return useSyncExternalStore(mobileStore.subscribe, mobileStore.getSnapshot, getServerSnapshot);
}

export function useIsBelowLg(): boolean {
  return useSyncExternalStore(belowLgStore.subscribe, belowLgStore.getSnapshot, getServerSnapshot);
}
