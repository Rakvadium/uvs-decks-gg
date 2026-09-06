"use client";

import { useLayoutEffect, type RefObject } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const RESYNC_DELAYS_MS = [60, 180, 400, 800];
const ZOOM_TOLERANCE = 0.01;
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

export type ViewportMetrics = {
  offsetTop: number;
  height: number;
  scale: number;
};

export type FrameBox = {
  top: number;
  height: number;
};

export function isZoomed(scale: number) {
  return Math.abs(scale - 1) > ZOOM_TOLERANCE;
}

export function resolveFrameBox(viewport: ViewportMetrics | null): FrameBox | null {
  if (!viewport || isZoomed(viewport.scale)) return null;
  return {
    top: Math.round(viewport.offsetTop),
    height: Math.round(viewport.height),
  };
}

export function shouldResetViewportScroll(
  viewport: ViewportMetrics | null,
  textEntryFocused: boolean
) {
  if (!viewport || isZoomed(viewport.scale)) return false;
  if (textEntryFocused) return false;
  return viewport.offsetTop > 0;
}

export function applyFrameBox(node: HTMLElement, box: FrameBox | null) {
  if (!box) {
    node.style.top = "";
    node.style.height = "";
    return;
  }
  node.style.top = `${box.top}px`;
  node.style.height = `${box.height}px`;
}

function isTextEntryElement(element: Element | null) {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(element.type);
  return element instanceof HTMLElement && element.isContentEditable;
}

function readViewport(): ViewportMetrics | null {
  const viewport = window.visualViewport;
  if (!viewport) return null;
  return {
    offsetTop: viewport.offsetTop,
    height: viewport.height,
    scale: viewport.scale,
  };
}

export function useMobileVisualViewportFrame(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const media = window.matchMedia(MOBILE_QUERY);
    const html = document.documentElement;
    const body = document.body;
    let active = false;
    let animationFrame = 0;
    let timers: number[] = [];
    let previousHtmlOverflow = "";
    let previousBodyOverflow = "";

    const sync = () => {
      if (!active) return;
      const viewport = readViewport();
      applyFrameBox(node, resolveFrameBox(viewport));
      if (shouldResetViewportScroll(viewport, isTextEntryElement(document.activeElement))) {
        window.scrollTo(0, 0);
      }
    };

    const scheduleSync = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(sync);
    };

    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };

    const resync = () => {
      clearTimers();
      scheduleSync();
      timers = RESYNC_DELAYS_MS.map((delay) => window.setTimeout(sync, delay));
    };

    const activate = () => {
      if (active) return;
      active = true;
      previousHtmlOverflow = html.style.overflow;
      previousBodyOverflow = body.style.overflow;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      sync();
    };

    const deactivate = () => {
      if (!active) return;
      active = false;
      cancelAnimationFrame(animationFrame);
      clearTimers();
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      applyFrameBox(node, null);
    };

    const apply = () => {
      if (media.matches) activate();
      else deactivate();
    };

    apply();
    media.addEventListener("change", apply);
    window.visualViewport?.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("scroll", scheduleSync);
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("orientationchange", resync);
    window.addEventListener("pageshow", resync);
    window.addEventListener("focus", resync);
    document.addEventListener("focusin", resync);
    document.addEventListener("focusout", resync);
    document.addEventListener("visibilitychange", resync);

    return () => {
      deactivate();
      media.removeEventListener("change", apply);
      window.visualViewport?.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("orientationchange", resync);
      window.removeEventListener("pageshow", resync);
      window.removeEventListener("focus", resync);
      document.removeEventListener("focusin", resync);
      document.removeEventListener("focusout", resync);
      document.removeEventListener("visibilitychange", resync);
    };
  }, [ref]);
}
