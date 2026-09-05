"use client";

import { useLayoutEffect, type RefObject } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const KEYBOARD_INSET_THRESHOLD = 40;

export type MobileViewportBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function readMobileKeyboardInset(
  innerHeight: number,
  viewportHeight: number,
  viewportTop: number
) {
  const inset = innerHeight - viewportHeight - viewportTop;
  return inset > KEYBOARD_INSET_THRESHOLD ? Math.round(inset) : 0;
}

export function measureMobileVisualViewport(): MobileViewportBox {
  const viewport = window.visualViewport;
  return {
    top: viewport?.offsetTop ?? 0,
    left: viewport?.offsetLeft ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

export function resolveMobileShellViewport(
  measured: MobileViewportBox,
  keyboardInset: number,
  lastStable: MobileViewportBox | null
): MobileViewportBox {
  if (keyboardInset <= 0) return measured;
  if (lastStable) return lastStable;
  return {
    top: 0,
    left: 0,
    width: measured.width,
    height: measured.height + keyboardInset + measured.top,
  };
}

export function applyMobileVisualViewportFrame(
  node: HTMLElement,
  viewport: MobileViewportBox
) {
  node.style.position = "fixed";
  node.style.left = "0";
  node.style.right = "auto";
  node.style.top = "0";
  node.style.width = `${viewport.width}px`;
  node.style.height = `${viewport.height}px`;
  node.style.transform = `translate(${viewport.left}px, ${viewport.top}px)`;
}

function clearFrame(node: HTMLElement) {
  node.style.position = "";
  node.style.left = "";
  node.style.right = "";
  node.style.top = "";
  node.style.height = "";
  node.style.width = "";
  node.style.transform = "";
}

export function useMobileVisualViewportFrame(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const media = window.matchMedia(MOBILE_QUERY);
    const html = document.documentElement;
    const body = document.body;
    let previousHtmlOverflow = html.style.overflow;
    let previousBodyOverflow = body.style.overflow;
    let previousHtmlOverscroll = html.style.overscrollBehavior;
    let previousBodyOverscroll = body.style.overscrollBehavior;
    let active = false;
    let orientationTimer = 0;
    let lastStable: MobileViewportBox | null = null;

    const sync = () => {
      if (!active) return;
      const measured = measureMobileVisualViewport();
      const keyboardInset = readMobileKeyboardInset(
        window.innerHeight,
        measured.height,
        measured.top
      );
      const next = resolveMobileShellViewport(measured, keyboardInset, lastStable);
      if (keyboardInset <= 0) lastStable = measured;
      applyMobileVisualViewportFrame(node, next);
    };

    const syncSoon = () => {
      sync();
      requestAnimationFrame(() => {
        sync();
        requestAnimationFrame(sync);
      });
    };

    const activate = () => {
      if (active) return;
      active = true;
      previousHtmlOverflow = html.style.overflow;
      previousBodyOverflow = body.style.overflow;
      previousHtmlOverscroll = html.style.overscrollBehavior;
      previousBodyOverscroll = body.style.overscrollBehavior;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      body.style.overscrollBehavior = "none";
      sync();
    };

    const deactivate = () => {
      if (!active) return;
      active = false;
      lastStable = null;
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
      clearFrame(node);
    };

    const apply = () => {
      if (media.matches) activate();
      else deactivate();
    };

    const onOrientationChange = () => {
      lastStable = null;
      syncSoon();
      window.clearTimeout(orientationTimer);
      orientationTimer = window.setTimeout(sync, 250);
    };

    apply();
    media.addEventListener("change", apply);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", onOrientationChange);
    window.addEventListener("pageshow", syncSoon);
    window.addEventListener("focusout", syncSoon);
    window.addEventListener("touchend", syncSoon, { passive: true });
    document.addEventListener("visibilitychange", sync);

    return () => {
      window.clearTimeout(orientationTimer);
      deactivate();
      media.removeEventListener("change", apply);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("pageshow", syncSoon);
      window.removeEventListener("focusout", syncSoon);
      window.removeEventListener("touchend", syncSoon);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref]);
}
