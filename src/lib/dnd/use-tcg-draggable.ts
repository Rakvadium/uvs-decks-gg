"use client";

import * as React from "react";
import { Doc } from "../../../convex/_generated/dataModel";

type Card = Doc<"cards">;
import { UNIVERSUS_CARD_DND_ENABLED, useTcgDndActions } from "./tcg-dnd-provider";
import { useIsMobile } from "@/hooks/useIsMobile";

function isDndDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (window as any).__TCG_DND_DEBUG__ === true || window.localStorage?.getItem("tcg:dndDebug") === "1";
  } catch {
    return (window as any).__TCG_DND_DEBUG__ === true;
  }
}

function dndLog(...args: any[]) {
  if (!isDndDebugEnabled()) return;
  console.log("[tcg-dnd]", ...args);
}

function readPreviewImageUrlFromRef(ref: React.RefObject<HTMLImageElement | null> | undefined): string | undefined {
  const el = ref?.current;
  if (!el) return undefined;
  const raw = (el.currentSrc || el.src || "").trim();
  return raw.length > 0 ? raw : undefined;
}

export interface UseTcgDraggableOptions {
  card: Card;
  sourceId?: string;
  previewImageRef?: React.RefObject<HTMLImageElement | null>;
  isDisabled?: boolean;
  dragStartDistance?: number;
  skipDragSelector?: string;
}

export interface UseTcgDraggableResult {
  isDragging: boolean;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
}

const emptyResult: UseTcgDraggableResult = {
  isDragging: false,
  dragHandleProps: {
    onMouseDown: () => {},
    onTouchStart: () => {},
    style: { cursor: "default" },
  },
};

export function useTcgDraggable({
  card,
  sourceId,
  previewImageRef,
  isDisabled = false,
  dragStartDistance = 6,
  skipDragSelector = 'button, [role="menuitem"], a, input, textarea, select, [data-no-drag]',
}: UseTcgDraggableOptions): UseTcgDraggableResult {
  const [localIsDragging, setLocalIsDragging] = React.useState(false);
  const startPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const startedRef = React.useRef(false);
  const { startDrag, endDrag } = useTcgDndActions();
  const isMobile = useIsMobile();

  const handleDragStart = React.useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isDisabled) return;

      const target = e.target as HTMLElement | null;
      if (target && target.closest(skipDragSelector)) {
        dndLog("draggable.pointerDown.skip", { sourceId, cardId: card?._id });
        return;
      }

      const getPoint = (evt: any): { x: number; y: number } | null => {
        if (evt?.touches && evt.touches.length > 0) {
          return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
        }
        if (evt?.changedTouches && evt.changedTouches.length > 0) {
          return { x: evt.changedTouches[0].clientX, y: evt.changedTouches[0].clientY };
        }
        if (typeof evt?.clientX === "number" && typeof evt?.clientY === "number") {
          return { x: evt.clientX, y: evt.clientY };
        }
        return null;
      };

      const startPoint = getPoint(e);
      if (!startPoint) return;

      dndLog("draggable.pointerDown", { sourceId, cardId: card?._id, startPoint });
      startPointRef.current = startPoint;
      startedRef.current = false;

      const handleMove = (evt: any) => {
        if (startedRef.current) return;
        const p = getPoint(evt);
        const sp = startPointRef.current;
        if (!p || !sp) return;

        const dx = p.x - sp.x;
        const dy = p.y - sp.y;
        const dist = Math.hypot(dx, dy);
        if (dist < dragStartDistance) return;

        startedRef.current = true;
        setLocalIsDragging(true);
        document.body.style.userSelect = "none";
        dndLog("draggable.dragStart", { sourceId, cardId: card?._id, dist });

        startDrag({
          type: "card",
          card,
          sourceId,
          previewImageUrl: readPreviewImageUrlFromRef(previewImageRef),
        });

        if (evt?.preventDefault) evt.preventDefault();
        if (evt?.stopPropagation) evt.stopPropagation();
      };

      const handleEnd = () => {
        startPointRef.current = null;

        if (startedRef.current) {
          startedRef.current = false;
          setLocalIsDragging(false);
          document.body.style.userSelect = "";
          dndLog("draggable.dragEnd", { sourceId, cardId: card?._id });
          endDrag();
        }

        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchend", handleEnd);
        window.removeEventListener("touchcancel", handleEnd);
        window.removeEventListener("dragend", handleEnd);
        window.removeEventListener("drop", handleEnd);
        window.removeEventListener("blur", handleEnd);
      };

      window.addEventListener("mousemove", handleMove, { passive: false });
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);
      window.addEventListener("dragend", handleEnd);
      window.addEventListener("drop", handleEnd);
      window.addEventListener("blur", handleEnd);
    },
    [isDisabled, skipDragSelector, dragStartDistance, card, sourceId, previewImageRef, startDrag, endDrag]
  );

  if (!UNIVERSUS_CARD_DND_ENABLED || isDisabled || isMobile) {
    return emptyResult;
  }

  return {
    isDragging: localIsDragging,
    dragHandleProps: {
      onMouseDown: handleDragStart,
      onTouchStart: handleDragStart,
      style: { cursor: "grab" },
    },
  };
}
