"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import { MOBILE_SHEET_PANEL } from "../mobile-glass";
import { MobileActionsSheetActionPanel } from "./content";
import { useMobileActionsSheetContext } from "./context";

const MEDIUM_RATIO = 0.58;
const LARGE_RATIO = 0.92;
const CLOSE_RATIO = 0.6;
const SNAP_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

type Detents = { medium: number; large: number };

function readDetents(): Detents {
  if (typeof window === "undefined") {
    return { medium: 480, large: 760 };
  }
  const viewport = window.innerHeight;
  return {
    medium: Math.round(viewport * MEDIUM_RATIO),
    large: Math.round(viewport * LARGE_RATIO),
  };
}

type DragState = {
  pointerId: number;
  startHeight: number;
  startY: number;
  moved: boolean;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], [role="textbox"], [contenteditable="true"]'
    )
  );
}

export function MobileActionsBottomSheet() {
  const { activeSlot, isActionsSheetOpen, closeSheet } = useMobileActionsSheetContext();
  const [detents, setDetents] = useState<Detents>(readDetents);
  const [sheetHeight, setSheetHeight] = useState(() => readDetents().medium);
  const [isDragging, setIsDragging] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const pendingHeightRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const appliedHeightRef = useRef(sheetHeight);

  useEffect(() => {
    const handleResize = () => {
      const next = readDetents();
      setDetents(next);
      setSheetHeight((current) => (current > next.medium + 40 ? next.large : next.medium));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isActionsSheetOpen && !isRendered) {
    setIsRendered(true);
  }

  useEffect(() => {
    if (isActionsSheetOpen) return;
    const timeout = window.setTimeout(() => setIsRendered(false), 320);
    return () => window.clearTimeout(timeout);
  }, [isActionsSheetOpen]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const clampHeight = useCallback(
    (height: number) => Math.min(detents.large, Math.max(0, height)),
    [detents.large]
  );

  const applyHeight = useCallback((height: number) => {
    const panel = panelRef.current;
    if (panel) {
      panel.style.height = `${height}px`;
    }
    appliedHeightRef.current = height;
  }, []);

  const scheduleApply = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingHeightRef.current;
      if (pending !== null && dragStateRef.current) {
        applyHeight(pending);
      }
    });
  }, [applyHeight]);

  const settle = useCallback(
    (height: number) => {
      if (height < detents.medium * CLOSE_RATIO) {
        setSheetHeight(detents.medium);
        closeSheet();
        return;
      }
      const midpoint = (detents.medium + detents.large) / 2;
      setSheetHeight(height >= midpoint ? detents.large : detents.medium);
    },
    [closeSheet, detents.large, detents.medium]
  );

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingHeightRef.current = null;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startHeight: sheetHeight,
      startY: event.clientY,
      moved: false,
    };
    appliedHeightRef.current = sheetHeight;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const next = clampHeight(drag.startHeight + (drag.startY - event.clientY));
    if (Math.abs(next - drag.startHeight) > 2) {
      drag.moved = true;
    }
    pendingHeightRef.current = next;
    scheduleApply();
  };

  const finishDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const pending = pendingHeightRef.current;
    if (pending !== null) {
      applyHeight(pending);
    }
    pendingHeightRef.current = null;
    dragStateRef.current = null;
    setIsDragging(false);

    if (!drag.moved) {
      setSheetHeight(drag.startHeight);
      return;
    }
    settle(appliedHeightRef.current);
  };

  if (!isRendered && !isActionsSheetOpen) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="false"
      aria-label={activeSlot?.label ?? "Page details"}
      aria-hidden={!isActionsSheetOpen || undefined}
    >
      <div
        ref={panelRef}
        className={cn(
          "pointer-events-auto relative flex flex-col overflow-hidden",
          MOBILE_SHEET_PANEL,
          !isDragging && "motion-safe:transition-[height,transform] motion-safe:duration-300",
          isActionsSheetOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          height: sheetHeight,
          transitionTimingFunction: SNAP_EASING,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <MobileActionsSheetActionPanel
          onGrabberPointerDown={beginDrag}
          onGrabberPointerMove={updateDrag}
          onGrabberPointerUp={finishDrag}
          onGrabberPointerCancel={finishDrag}
        />
      </div>
    </div>
  );
}
