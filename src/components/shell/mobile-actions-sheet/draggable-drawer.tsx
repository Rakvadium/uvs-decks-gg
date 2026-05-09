"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MobileActionsSheetActionPanel } from "./content";
import { useMobileActionsSheetContext } from "./context";

const DEFAULT_HEIGHT = 600;
const MAX_HEIGHT_RATIO = 0.82;

function getMaxDrawerHeight() {
  if (typeof window === "undefined") {
    return 640;
  }

  return Math.max(DEFAULT_HEIGHT, Math.floor(window.innerHeight * MAX_HEIGHT_RATIO));
}

function isMobileDeckDatabaseListPath(rawPathname: string): boolean {
  const path = rawPathname.split("?")[0] ?? "";
  return /^\/decks\/?$/.test(path);
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

  return Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], [role="textbox"], [contenteditable="true"]'
    )
  );
}

interface MobileActionsHandleProps extends ComponentPropsWithoutRef<"button"> {
  className?: string;
  decorative?: boolean;
}

export function MobileActionsHandle({ className, decorative = false, ...props }: MobileActionsHandleProps) {
  const baseClassName = cn(
    "group relative z-20 flex items-center justify-center bg-transparent",
    decorative ? "h-3 min-h-3 w-16" : "h-4 w-20",
    className
  );

  if (decorative) {
    return (
      <div aria-hidden className={baseClassName}>
        <span className="relative block h-1 w-16 shrink-0 rounded-full bg-primary">
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
  const pathname = usePathname();
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
  const grabberStripRef = useRef<HTMLDivElement | null>(null);

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
    const bottomEl = bottomStackRef.current;
    const grabEl = grabberStripRef.current;

    if (!bottomEl) {
      return;
    }

    const updateHeight = () => {
      const bottom = bottomEl.getBoundingClientRect().height;
      const grab = grabEl?.getBoundingClientRect().height ?? 0;
      setBottomStackHeight(bottom + grab);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(bottomEl);
    if (grabEl) {
      observer.observe(grabEl);
    }

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
      shell.style.height = `${height}px`;
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

  const useDrawerChrome = sidebarSlots.length > 0 && !isMobileDeckDatabaseListPath(pathname);

  if (!useDrawerChrome) {
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
      style={{ height: drawerHeight }}
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
        className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[8px] border-x border-t [border-color:var(--chrome-sheet-border)] shadow-[var(--chrome-sheet-shadow)]"
        style={{ height: drawerHeight }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-14 rounded-t-4 bg-gradient-to-b from-white/[0.06] via-primary/[0.025] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background/96 backdrop-blur-md">
            <div
              ref={grabberStripRef}
              className="flex shrink-0 touch-none justify-center px-4 pb-0.5 pt-1"
              onPointerDown={beginDrag}
              onPointerMove={updateDrag}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
            >
              <MobileActionsHandle decorative />
            </div>
            <div ref={actionPanelRef} className="min-h-0 overflow-hidden" style={{ height: actionPanelHeight }}>
              <MobileActionsSheetActionPanel
                onHeaderPointerDown={beginDrag}
                onHeaderPointerMove={updateDrag}
                onHeaderPointerUp={endDrag}
                onHeaderPointerCancel={cancelDrag}
              />
            </div>
          </div>
          <div ref={bottomStackRef} className="shrink-0">
            <div className="bg-background/96 backdrop-blur-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
