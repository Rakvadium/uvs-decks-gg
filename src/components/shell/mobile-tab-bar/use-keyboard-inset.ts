"use client";

import { useSyncExternalStore } from "react";
import { readMobileKeyboardInset } from "../use-mobile-visual-viewport";

function readKeyboardInset(): number {
  if (typeof window === "undefined" || !window.visualViewport) return 0;
  const viewport = window.visualViewport;
  return readMobileKeyboardInset(window.innerHeight, viewport.height, viewport.offsetTop);
}

function subscribe(onChange: () => void) {
  const viewport = typeof window === "undefined" ? null : window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener("resize", onChange);
  viewport.addEventListener("scroll", onChange);
  return () => {
    viewport.removeEventListener("resize", onChange);
    viewport.removeEventListener("scroll", onChange);
  };
}

const getServerSnapshot = () => 0;

export function useKeyboardInset(enabled: boolean): number {
  const inset = useSyncExternalStore(subscribe, readKeyboardInset, getServerSnapshot);
  return enabled ? inset : 0;
}
