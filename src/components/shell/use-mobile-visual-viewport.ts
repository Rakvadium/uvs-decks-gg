"use client";

import { useLayoutEffect, type RefObject } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function measureMobileVisualViewport() {
  const viewport = window.visualViewport;
  return {
    top: viewport?.offsetTop ?? 0,
    left: viewport?.offsetLeft ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

export function applyMobileVisualViewportFrame(
  node: HTMLElement,
  viewport: ReturnType<typeof measureMobileVisualViewport> = measureMobileVisualViewport()
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

    const sync = () => {
      if (active) applyMobileVisualViewportFrame(node);
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
      applyMobileVisualViewportFrame(node);
    };

    const deactivate = () => {
      if (!active) return;
      active = false;
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
