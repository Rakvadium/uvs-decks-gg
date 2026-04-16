"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MobileActionsSheetContent } from "./content";
import { useMobileActionsSheetContext } from "./context";
import { MobileActionsSheetHeader } from "./header";

const HANDLE_OVERLAP = 16;
const DEFAULT_HEIGHT = 600;
const MAX_HEIGHT_RATIO = 0.82;

function getMaxDrawerHeight() {
  if (typeof window === "undefined") {
    return 640;
  }

  return Math.max(DEFAULT_HEIGHT, Math.floor(window.innerHeight * MAX_HEIGHT_RATIO));
}

type DragState = {
  moved: boolean;
  pointerId: number;
  startHeight: number;
  startY: number;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("button, a, input, select, textarea, [role='button']"));
}

interface MobileActionsHandleProps extends ComponentPropsWithoutRef<"button"> {
  className?: string;
  decorative?: boolean;
}

export function MobileActionsHandle({ className, decorative = false, ...props }: MobileActionsHandleProps) {
  const baseClassName = cn(
    "group relative z-20 flex h-4 w-20 items-center justify-center bg-transparent",
    className
  );

  if (decorative) {
    return (
      <div aria-hidden className={baseClassName}>
        <span className="relative block h-2 w-24 rounded-full bg-primary">
          <span className="absolute inset-0 mx-auto w-px rounded-full bg-primary" />
        </span>
      </div>
    );
  }

  return (
    <button type="button" aria-label="Open actions panel" className={baseClassName} {...props}>
      <span className="relative block h-4 w-24 rounded-full bg-primary transition-all duration-150 group-hover:bg-primary">
        <span className="absolute inset-0 mx-auto w-px rounded-full bg-primary group-hover:bg-primary" />
      </span>
    </button>
  );
}

interface MobileActionsDraggableDrawerProps {
  children?: ReactNode;
}

export function MobileActionsDraggableDrawer({ children }: MobileActionsDraggableDrawerProps) {
  const { activeSlot, closeSheet, isActionsSheetOpen, openSheet, sidebarSlots } = useMobileActionsSheetContext();
  const [maxHeight, setMaxHeight] = useState(getMaxDrawerHeight);
  const [bottomStackHeight, setBottomStackHeight] = useState(0);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [isCloseTapShieldActive, setIsCloseTapShieldActive] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const isDraggingRef = useRef(false);
  const bottomStackRef = useRef<HTMLDivElement | null>(null);
  const closeTapShieldTimeoutRef = useRef<number | null>(null);
  const drawerShellRef = useRef<HTMLDivElement | null>(null);
  const drawerPanelRef = useRef<HTMLDivElement | null>(null);
  const actionPanelRef = useRef<HTMLDivElement | null>(null);
  const minHeightRef = useRef(0);
  const dragAppliedHeightRef = useRef(drawerHeight);
  const pendingDragHeightRef = useRef<number | null>(null);
  const dragRafRef = useRef<number | null>(null);

  const minHeight = bottomStackHeight;
  const actionPanelHeight = Math.max(0, drawerHeight - minHeight);

  minHeightRef.current = minHeight;
  if (!isDraggingRef.current) {
    dragAppliedHeightRef.current = drawerHeight;
  }

  const expandedHeight = useMemo(() => Math.min(DEFAULT_HEIGHT, maxHeight), [maxHeight]);

  const clampHeight = useCallback(
    (height: number) => Math.min(maxHeight, Math.max(minHeight, height)),
    [maxHeight, minHeight]
  );

  useEffect(() => {
    const handleResize = () => {
      const nextMaxHeight = getMaxDrawerHeight();
      setMaxHeight(nextMaxHeight);
      setDrawerHeight((currentHeight) => Math.min(Math.max(currentHeight, minHeight), nextMaxHeight));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [minHeight]);

  useLayoutEffect(() => {
    const element = bottomStackRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setBottomStackHeight(element.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    if (isActionsSheetOpen) {
      setDrawerHeight((currentHeight) =>
        currentHeight > minHeight + 12 ? clampHeight(currentHeight) : Math.max(expandedHeight, minHeight)
      );
      return;
    }

    setDrawerHeight(minHeight);
  }, [clampHeight, expandedHeight, isActionsSheetOpen, minHeight]);

  useEffect(() => {
    if (activeSlot && !isDraggingRef.current) {
      setDrawerHeight((currentHeight) => Math.max(currentHeight, Math.max(expandedHeight, minHeight)));
    }
  }, [activeSlot, expandedHeight, minHeight]);

  useEffect(() => {
    return () => {
      if (closeTapShieldTimeoutRef.current !== null) {
        window.clearTimeout(closeTapShieldTimeoutRef.current);
      }
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, []);

  const flushDragHeights = useCallback((height: number) => {
    const mh = minHeightRef.current;
    const actionH = Math.max(0, height - mh);
    const shell = drawerShellRef.current;
    const panel = drawerPanelRef.current;
    const actionPanel = actionPanelRef.current;
    if (shell) {
      shell.style.height = `${height + HANDLE_OVERLAP}px`;
    }
    if (panel) {
      panel.style.height = `${height}px`;
    }
    if (actionPanel) {
      actionPanel.style.height = `${actionH}px`;
    }
    dragAppliedHeightRef.current = height;
  }, []);

  const scheduleDragHeightApply = useCallback(() => {
    if (dragRafRef.current !== null) {
      return;
    }
    dragRafRef.current = window.requestAnimationFrame(() => {
      dragRafRef.current = null;
      if (!isDraggingRef.current) {
        return;
      }
      const pending = pendingDragHeightRef.current;
      if (pending !== null) {
        flushDragHeights(pending);
      }
    });
  }, [flushDragHeights]);

  const cancelDragRaf = useCallback(() => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
  }, []);

  if (sidebarSlots.length === 0) {
    return (
      <div className="pointer-events-auto relative mx-0 overflow-visible">
        <div ref={bottomStackRef} className="shrink-0">
          {children}
        </div>
      </div>
    );
  }

  const activateCloseTapShield = () => {
    if (closeTapShieldTimeoutRef.current !== null) {
      window.clearTimeout(closeTapShieldTimeoutRef.current);
    }

    setIsCloseTapShieldActive(true);
    closeTapShieldTimeoutRef.current = window.setTimeout(() => {
      setIsCloseTapShieldActive(false);
      closeTapShieldTimeoutRef.current = null;
    }, 350);
  };

  const settleDrawer = (height: number) => {
    const nextHeight = clampHeight(height);

    if (nextHeight <= minHeight + 24) {
      activateCloseTapShield();
      closeSheet();
      return;
    }

    setDrawerHeight(nextHeight);
    openSheet();
  };

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    event.preventDefault();
    cancelDragRaf();
    pendingDragHeightRef.current = null;
    isDraggingRef.current = true;
    dragStateRef.current = {
      moved: false,
      pointerId: event.pointerId,
      startHeight: drawerHeight,
      startY: event.clientY,
    };
    dragAppliedHeightRef.current = drawerHeight;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const nextHeight = clampHeight(dragState.startHeight + (dragState.startY - event.clientY));

    if (Math.abs(nextHeight - dragState.startHeight) > 2) {
      dragState.moved = true;
    }

    pendingDragHeightRef.current = nextHeight;
    scheduleDragHeightApply();
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    cancelDragRaf();
    const pending = pendingDragHeightRef.current;
    if (pending !== null) {
      flushDragHeights(pending);
    }
    pendingDragHeightRef.current = null;
    const appliedHeight = dragAppliedHeightRef.current;

    if (!dragState.moved) {
      if (appliedHeight <= minHeight + 12) {
        setDrawerHeight(Math.max(expandedHeight, minHeight));
        openSheet();
      } else {
        activateCloseTapShield();
        setDrawerHeight(minHeight);
        closeSheet();
      }
    } else {
      settleDrawer(appliedHeight);
    }

    dragStateRef.current = null;
    isDraggingRef.current = false;
  };

  const cancelDrag = () => {
    cancelDragRaf();
    const pending = pendingDragHeightRef.current;
    if (pending !== null) {
      flushDragHeights(pending);
    }
    pendingDragHeightRef.current = null;
    const appliedHeight = dragAppliedHeightRef.current;
    dragStateRef.current = null;
    isDraggingRef.current = false;
    settleDrawer(appliedHeight);
  };

  return (
    <div
      ref={drawerShellRef}
      className="pointer-events-auto relative mx-0 overflow-visible"
      style={{ height: drawerHeight + HANDLE_OVERLAP }}
    >
      {isCloseTapShieldActive ? (
        <div
          aria-hidden
          className="fixed inset-0 z-10"
          onClick={(event) => event.preventDefault()}
          onPointerDown={(event) => event.preventDefault()}
          onPointerUp={(event) => event.preventDefault()}
        />
      ) : null}
      <div
        ref={drawerPanelRef}
        className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[8px] border-x border-t [border-color:var(--chrome-sheet-border)] bg-background/96 shadow-[var(--chrome-sheet-shadow)] backdrop-blur-md"
        style={{ height: drawerHeight }}
      >
        <div
          className="absolute inset-x-0 top-0 z-20 flex h-10  touch-none justify-center"
          onPointerDown={beginDrag}
          onPointerMove={updateDrag}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
        >

          <MobileActionsHandle decorative className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-4 bg-gradient-to-b from-white/[0.06] via-primary/[0.025] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
          <div ref={actionPanelRef} className="min-h-0 overflow-hidden" style={{ height: actionPanelHeight }}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <MobileActionsSheetHeader
                className="touch-none"
                onPointerDown={beginDrag}
                onPointerMove={updateDrag}
                onPointerUp={endDrag}
                onPointerCancel={cancelDrag}
              />
              <MobileActionsSheetContent />
            </div>
          </div>
          <div ref={bottomStackRef} className="shrink-0 pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
