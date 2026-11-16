"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Shared motion for the Menu layout's morphing surfaces. A surface is always laid out at its
 * largest size and revealed with an animated `clip-path: inset(...)`, so it can grow out of the
 * control that opened it without scaling (and blurring) its contents.
 */
export const MORPH_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
export const MORPH_MS = 420;

/** Reduced motion: surfaces cross-fade in place instead of morphing (read when a transition is built). */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Transition for a surface's clip and fade. Closing shrinks first, then fades out at the end. */
export function morphTransition(open: boolean) {
  if (prefersReducedMotion()) return "opacity 150ms ease";
  const clip = `clip-path ${MORPH_MS}ms ${MORPH_EASE}`;
  const fade = open ? "opacity 120ms ease-out" : `opacity 140ms ease-in ${MORPH_MS - 160}ms`;
  return `${clip}, ${fade}`;
}

/**
 * An element's rendered corner radius in px, so clip shapes match whatever the active chrome sets
 * (`rounded-pill`, `rounded-3xl`, ...). A 9999px pill is clamped to half the shorter side.
 */
export function cornerRadius(element: Element | null | undefined, fallback = 0) {
  if (!element) return fallback;
  const rect = element.getBoundingClientRect();
  const value = parseFloat(getComputedStyle(element).borderTopLeftRadius);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(value, Math.min(rect.width, rect.height) / 2);
}

function subscribeToChrome(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-chrome", "class"] });
  return () => observer.disconnect();
}

/**
 * Changes whenever the chrome (or light/dark) switches. Shapes measured from the DOM (corner radii)
 * re-measure on it, because a chrome switch changes radii without resizing anything.
 */
export function useChromeKey() {
  return useSyncExternalStore(
    subscribeToChrome,
    () => `${document.documentElement.dataset.chrome ?? ""}:${document.documentElement.className}`,
    () => ""
  );
}

/** Stays true until the closing animation has finished, so content can animate out. */
export function usePresence(open: boolean, ms = MORPH_MS) {
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);

  useEffect(() => {
    if (open) return;
    const timeout = window.setTimeout(() => setPresent(false), ms);
    return () => window.clearTimeout(timeout);
  }, [open, ms]);

  return open || present;
}
