"use client";

import { useSyncExternalStore, type RefObject } from "react";

const KEYBOARD_INSET_THRESHOLD = 40;

export function readBarKeyboardInset(bar: HTMLElement | null) {
  if (typeof window === "undefined" || !window.visualViewport) return 0;
  const viewport = window.visualViewport;
  const visibleBottom = viewport.offsetTop + viewport.height;
  if (!bar) {
    const inset = window.innerHeight - visibleBottom;
    return inset > KEYBOARD_INSET_THRESHOLD ? Math.round(inset) : 0;
  }
  const currentBottom = Number.parseFloat(bar.style.bottom) || 0;
  const inset = bar.getBoundingClientRect().bottom + currentBottom - visibleBottom;
  return inset > KEYBOARD_INSET_THRESHOLD ? Math.round(inset) : 0;
}

function subscribe(onChange: () => void) {
  const viewport = typeof window === "undefined" ? null : window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener("resize", onChange);
  viewport.addEventListener("scroll", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    viewport.removeEventListener("resize", onChange);
    viewport.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

const getServerSnapshot = () => 0;

export function useKeyboardInset(
  enabled: boolean,
  barRef: RefObject<HTMLElement | null>
): number {
  const inset = useSyncExternalStore(
    subscribe,
    () => readBarKeyboardInset(barRef.current),
    getServerSnapshot
  );
  return enabled ? inset : 0;
}
