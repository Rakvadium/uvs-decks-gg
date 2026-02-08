"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CardDetailsVariant = "v1" | "v2" | "v3" | "v4" | "v5";

export const VARIANT_LABELS: Record<CardDetailsVariant, string> = {
  v1: "Neon HUD",
  v2: "Holographic",
  v3: "Terminal",
  v4: "Minimalist",
  v5: "Datastream",
};

const STORAGE_KEY = "uvs-decks:card-details-variant";
const DEFAULT_VARIANT: CardDetailsVariant = "v1";
const VALID_VARIANTS = new Set<string>(["v1", "v2", "v3", "v4", "v5"]);

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): CardDetailsVariant {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_VARIANTS.has(stored)) return stored as CardDetailsVariant;
  } catch {}
  return DEFAULT_VARIANT;
}

function getServerSnapshot(): CardDetailsVariant {
  return DEFAULT_VARIANT;
}

export function useCardDetailsVariant() {
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setVariant = useCallback((v: CardDetailsVariant) => {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
    emitChange();
  }, []);

  return { variant, setVariant };
}
