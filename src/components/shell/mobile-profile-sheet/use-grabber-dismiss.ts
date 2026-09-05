"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";

const SNAP_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const SNAP_MS = 200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useGrabberDismiss(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const closeOnEndRef = useRef(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const applyTranslate = useCallback((y: number, withTransition: boolean) => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.transition = withTransition ? `transform ${SNAP_MS}ms ${SNAP_EASING}` : "none";
    panel.style.transform = y > 0 ? `translate3d(0, ${y}px, 0)` : "";
  }, []);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const resetTranslate = useCallback(() => {
    closeOnEndRef.current = false;
    clearCloseTimeout();
    applyTranslate(0, false);
  }, [applyTranslate, clearCloseTimeout]);

  const finishClose = useCallback(() => {
    closeTimeoutRef.current = null;
    if (!closeOnEndRef.current) return;
    closeOnEndRef.current = false;
    onClose();
  }, [onClose]);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    closeOnEndRef.current = false;
    clearCloseTimeout();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      moved: false,
    };
    applyTranslate(0, false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dy = Math.max(0, event.clientY - drag.startY);
    if (Math.abs(event.clientY - drag.startY) > 2) {
      drag.moved = true;
    }
    drag.lastY = event.clientY;
    applyTranslate(dy, false);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dy = Math.max(0, drag.lastY - drag.startY);
    dragRef.current = null;

    if (!drag.moved) {
      applyTranslate(0, false);
      return;
    }

    const height = panelRef.current?.getBoundingClientRect().height ?? 0;
    const shouldClose = dy > Math.max(72, height * 0.25);

    if (shouldClose && height > 0) {
      if (prefersReducedMotion()) {
        applyTranslate(0, false);
        onClose();
        return;
      }
      closeOnEndRef.current = true;
      applyTranslate(height, true);
      closeTimeoutRef.current = window.setTimeout(finishClose, SNAP_MS + 20);
      return;
    }

    applyTranslate(0, !prefersReducedMotion());
  };

  return {
    panelRef,
    resetTranslate,
    grabberProps: {
      onPointerDown: beginDrag,
      onPointerMove: updateDrag,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
    },
  };
}
