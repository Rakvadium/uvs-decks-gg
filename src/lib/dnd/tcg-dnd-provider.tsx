"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Doc } from "../../../convex/_generated/dataModel";
import { IMAGE_BASE_URL } from "@/config/universus";

type Card = Doc<"cards">;

export interface DragItem {
  type: "card";
  card: Card;
  sourceId?: string;
}

export const TCG_DND_ACCEPTS_CARD_ONLY: DragItem["type"][] = ["card"];

export const UNIVERSUS_CARD_DND_ENABLED = true;

export interface DropZoneConfig {
  id: string;
  accepts: DragItem["type"][];
  onDrop: (item: DragItem) => void;
  isDisabled?: boolean;
}

interface TcgDndContextValue {
  dragItem: DragItem | null;
  isDragging: boolean;
  activeDropZone: string | null;
  startDrag: (item: DragItem) => void;
  endDrag: (dropZoneId?: string | null) => void;
  registerDropZone: (config: DropZoneConfig) => void;
  unregisterDropZone: (id: string) => void;
  setActiveDropZone: (id: string | null) => void;
}

const TcgDndContext = React.createContext<TcgDndContextValue | null>(null);

function isDndDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const urlEnabled = new URLSearchParams(window.location.search).get("dndDebug") === "1";
    return urlEnabled || (window as any).__TCG_DND_DEBUG__ === true || window.localStorage?.getItem("tcg:dndDebug") === "1";
  } catch {
    return (window as any).__TCG_DND_DEBUG__ === true;
  }
}

function dndLog(...args: any[]) {
  if (!isDndDebugEnabled()) return;
  console.log("[tcg-dnd]", ...args);
}

function resolveImageUrl(imageUrl: string | undefined, imageBaseUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  if (imageBaseUrl) return `${imageBaseUrl}/${imageUrl}`;
  return imageUrl;
}

function DragOverlay() {
  const { dragItem } = useTcgDnd();
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!dragItem) {
      setPos(null);
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

    const handleMove = (evt: any) => {
      const p = getPoint(evt);
      if (!p) return;
      setPos(p);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [dragItem]);

  if (!dragItem || !pos) return null;

  const imageUrl = resolveImageUrl(dragItem.card?.imageUrl, IMAGE_BASE_URL);
  const overlayWidth = 144;
  const overlayHeight = 201;

  return createPortal(
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] transition-transform duration-75 ease-out"
      style={{
        transform: `translate3d(${pos.x - overlayWidth / 2}px, ${pos.y - overlayHeight / 2}px, 0)`,
      }}
    >
      <div
        className="overflow-hidden rounded-xl border bg-background/70 shadow-2xl ring-1 ring-primary/20"
        style={{ width: overlayWidth, height: overlayHeight }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={dragItem.card?.name ?? ""} draggable={false} className="block h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-medium">
            {dragItem.card?.name ?? "Card"}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function TcgDndProvider({ children }: { children: React.ReactNode }) {
  const [dragItem, setDragItem] = React.useState<DragItem | null>(null);
  const [activeDropZone, setActiveDropZone] = React.useState<string | null>(null);
  const dropZonesRef = React.useRef<Map<string, DropZoneConfig>>(new Map());
  const dragItemRef = React.useRef<DragItem | null>(null);
  const activeDropZoneRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    dragItemRef.current = dragItem;
  }, [dragItem]);

  React.useEffect(() => {
    activeDropZoneRef.current = activeDropZone;
  }, [activeDropZone]);

  const startDrag = React.useCallback((item: DragItem) => {
    if (!UNIVERSUS_CARD_DND_ENABLED) return;
    dndLog("startDrag", {
      type: item.type,
      cardId: item.card?._id,
      sourceId: item.sourceId,
      activeDropZone: activeDropZoneRef.current,
    });
    dragItemRef.current = item;
    setDragItem(item);
  }, []);

  const endDrag = React.useCallback((dropZoneId?: string | null) => {
    const currentDragItem = dragItemRef.current;
    const currentActiveDropZone = activeDropZoneRef.current;
    const resolvedDropZoneId = dropZoneId === undefined ? currentActiveDropZone : dropZoneId;

    dndLog("endDrag", {
      passedDropZoneId: dropZoneId,
      activeDropZone: currentActiveDropZone,
      resolvedDropZoneId,
      hasDragItem: !!currentDragItem,
      dragItemType: currentDragItem?.type,
      dragCardId: currentDragItem?.card?._id,
      dropZonesCount: dropZonesRef.current.size,
    });

    if (resolvedDropZoneId && currentDragItem) {
      const dropZone = dropZonesRef.current.get(resolvedDropZoneId);
      dndLog("endDrag.resolveDropZone", {
        resolvedDropZoneId,
        dropZoneFound: !!dropZone,
        dropZoneDisabled: dropZone?.isDisabled,
        accepts: dropZone?.accepts,
      });
      if (dropZone && !dropZone.isDisabled && dropZone.accepts.includes(currentDragItem.type)) {
        dndLog("endDrag.onDrop.invoke", { resolvedDropZoneId });
        try {
          dropZone.onDrop(currentDragItem);
        } catch (err) {
          dndLog("endDrag.onDrop.error", { resolvedDropZoneId, err });
        }
      }
    }

    dragItemRef.current = null;
    activeDropZoneRef.current = null;
    setDragItem(null);
    setActiveDropZone(null);
  }, []);

  const registerDropZone = React.useCallback((config: DropZoneConfig) => {
    dndLog("registerDropZone", {
      id: config.id,
      accepts: config.accepts,
      isDisabled: config.isDisabled,
    });
    dropZonesRef.current.set(config.id, config);
  }, []);

  const unregisterDropZone = React.useCallback((id: string) => {
    dndLog("unregisterDropZone", { id });
    dropZonesRef.current.delete(id);
  }, []);

  const setActiveDropZoneSafe = React.useCallback((id: string | null) => {
    activeDropZoneRef.current = id;
    setActiveDropZone(id);
  }, []);

  React.useEffect(() => {
    if (!isDndDebugEnabled()) return;
    dndLog("state", {
      isDragging: dragItem !== null,
      activeDropZone,
      dragItemType: dragItem?.type,
      dragCardId: dragItem?.card?._id,
      dragSourceId: dragItem?.sourceId,
    });
  }, [dragItem, activeDropZone]);

  const value: TcgDndContextValue = React.useMemo(() => ({
    dragItem,
    isDragging: dragItem !== null,
    activeDropZone,
    startDrag,
    endDrag,
    registerDropZone,
    unregisterDropZone,
    setActiveDropZone: setActiveDropZoneSafe,
  }), [dragItem, activeDropZone, startDrag, endDrag, registerDropZone, unregisterDropZone, setActiveDropZoneSafe]);

  return (
    <TcgDndContext.Provider value={value}>
      {children}
      <DragOverlay />
    </TcgDndContext.Provider>
  );
}

export function useTcgDnd() {
  const context = React.useContext(TcgDndContext);
  if (!context) {
    throw new Error("useTcgDnd must be used within a TcgDndProvider");
  }
  return context;
}
