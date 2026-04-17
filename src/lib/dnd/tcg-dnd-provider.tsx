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
  previewImageUrl?: string;
}

export const TCG_DND_ACCEPTS_CARD_ONLY: DragItem["type"][] = ["card"];

export const UNIVERSUS_CARD_DND_ENABLED = true;

export const TCG_DROP_ZONE_DATA_ATTR = "data-tcg-drop-zone" as const;

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

type TcgDndActionsContextValue = Pick<
  TcgDndContextValue,
  "startDrag" | "endDrag" | "registerDropZone" | "unregisterDropZone" | "setActiveDropZone"
>;

type TcgDndDragStateContextValue = Pick<TcgDndContextValue, "dragItem" | "isDragging">;

const TcgDndActionsContext = React.createContext<TcgDndActionsContextValue | null>(null);
const TcgDndDragStateContext = React.createContext<TcgDndDragStateContextValue | null>(null);

type StoreListener = () => void;

interface ActiveDropZoneStore {
  getSnapshot: () => string | null;
  subscribe: (listener: StoreListener) => () => void;
  emit: (next: string | null) => void;
}

function createActiveDropZoneStore(): ActiveDropZoneStore {
  let value: string | null = null;
  const listeners = new Set<StoreListener>();
  return {
    getSnapshot: () => value,
    subscribe: (listener: StoreListener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit: (next: string | null) => {
      if (next === value) return;
      value = next;
      listeners.forEach((l) => l());
    },
  };
}

const ActiveDropZoneStoreContext = React.createContext<ActiveDropZoneStore | null>(null);

function getActiveDropZoneServerSnapshot(): null {
  return null;
}

function getIsOverServerSnapshot(): false {
  return false;
}

type WindowWithDndDebug = Window & { __TCG_DND_DEBUG__?: boolean };

function readDndDebugFlag(w: Window): boolean {
  return (w as WindowWithDndDebug).__TCG_DND_DEBUG__ === true;
}

function isDndDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const urlEnabled = new URLSearchParams(window.location.search).get("dndDebug") === "1";
    return urlEnabled || readDndDebugFlag(window) || window.localStorage?.getItem("tcg:dndDebug") === "1";
  } catch {
    return readDndDebugFlag(window);
  }
}

function dndLog(...args: unknown[]) {
  if (!isDndDebugEnabled()) return;
  console.log("[tcg-dnd]", ...args);
}

function resolveImageUrl(imageUrl: string | undefined, imageBaseUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  if (imageBaseUrl) return `${imageBaseUrl}/${imageUrl}`;
  return imageUrl;
}

const DRAG_OVERLAY_WIDTH = 144;
const DRAG_OVERLAY_HEIGHT = 201;

function getPointerFromMoveEvent(evt: Event): { x: number; y: number } | null {
  if (typeof TouchEvent !== "undefined" && evt instanceof TouchEvent) {
    if (evt.touches.length > 0) {
      const t = evt.touches[0];
      return { x: t.clientX, y: t.clientY };
    }
    if (evt.changedTouches.length > 0) {
      const t = evt.changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return null;
  }
  if (evt instanceof MouseEvent) {
    return { x: evt.clientX, y: evt.clientY };
  }
  return null;
}

function resolveRegisteredDropZoneIdAtClientPoint(
  clientX: number,
  clientY: number,
  dragItem: DragItem,
  zones: Map<string, DropZoneConfig>
): string | null {
  if (typeof document === "undefined") return null;
  const top = document.elementFromPoint(clientX, clientY);
  if (!top) return null;
  const marked = top.closest(`[${TCG_DROP_ZONE_DATA_ATTR}]`);
  if (!marked) return null;
  const id = marked.getAttribute(TCG_DROP_ZONE_DATA_ATTR);
  if (!id) return null;
  const config = zones.get(id);
  if (!config || config.isDisabled) return null;
  if (!config.accepts.includes(dragItem.type)) return null;
  return id;
}

function DragOverlay() {
  const { dragItem } = useTcgDndDragState();
  const [seeded, setSeeded] = React.useState(false);
  const seededRef = React.useRef(false);
  const overlayOuterRef = React.useRef<HTMLDivElement>(null);
  const pendingRef = React.useRef<{ x: number; y: number } | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const applyTransform = React.useCallback(() => {
    const el = overlayOuterRef.current;
    const p = pendingRef.current;
    if (!el || !p) return;
    el.style.transform = `translate3d(${p.x - DRAG_OVERLAY_WIDTH / 2}px, ${p.y - DRAG_OVERLAY_HEIGHT / 2}px, 0)`;
  }, []);

  const flushTransform = React.useCallback(() => {
    rafRef.current = null;
    applyTransform();
  }, [applyTransform]);

  const scheduleFlush = React.useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(flushTransform);
  }, [flushTransform]);

  React.useEffect(() => {
    if (!dragItem) {
      seededRef.current = false;
      setSeeded(false);
      pendingRef.current = null;
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    seededRef.current = false;
    setSeeded(false);

    const handleMove = (evt: Event) => {
      const p = getPointerFromMoveEvent(evt);
      if (!p) return;
      pendingRef.current = p;
      if (!seededRef.current) {
        seededRef.current = true;
        setSeeded(true);
      }
      scheduleFlush();
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [dragItem, scheduleFlush]);

  React.useLayoutEffect(() => {
    if (!dragItem || !seeded) return;
    applyTransform();
  }, [dragItem, seeded, applyTransform]);

  if (!dragItem || !seeded) return null;

  const preview = dragItem.previewImageUrl?.trim();
  const imageUrl =
    preview && preview.length > 0 ? preview : resolveImageUrl(dragItem.card?.imageUrl, IMAGE_BASE_URL);

  const cardName = dragItem.card?.name ?? "";

  return createPortal(
    <DragOverlayImage
      overlayOuterRef={overlayOuterRef}
      imageUrl={imageUrl}
      alt={cardName}
      fallbackLabel={cardName || "Card"}
    />,
    document.body
  );
}

function DragOverlayImage({
  overlayOuterRef,
  imageUrl,
  alt,
  fallbackLabel,
}: {
  overlayOuterRef: React.RefObject<HTMLDivElement | null>;
  imageUrl: string | undefined;
  alt: string;
  fallbackLabel: string;
}) {
  const overlayImgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (!imageUrl) return;
    const id = window.requestAnimationFrame(() => {
      const img = overlayImgRef.current;
      if (!img?.decode) return;
      void img.decode().catch(() => {});
    });
    return () => window.cancelAnimationFrame(id);
  }, [imageUrl]);

  return (
    <div
      ref={overlayOuterRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
    >
      <div
        className="overflow-hidden rounded-xl border bg-background/70 shadow-2xl ring-1 ring-primary/20"
        style={{ width: DRAG_OVERLAY_WIDTH, height: DRAG_OVERLAY_HEIGHT }}
      >
        {imageUrl ? (
          <img
            ref={overlayImgRef}
            src={imageUrl}
            alt={alt}
            draggable={false}
            className="block h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-medium">
            {fallbackLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export function TcgDndProvider({ children }: { children: React.ReactNode }) {
  const [dragItem, setDragItem] = React.useState<DragItem | null>(null);
  const dropZonesRef = React.useRef<Map<string, DropZoneConfig>>(new Map());
  const dragItemRef = React.useRef<DragItem | null>(null);
  const activeDropZoneRef = React.useRef<string | null>(null);
  const activeDropZoneStoreRef = React.useRef<ActiveDropZoneStore | null>(null);
  if (!activeDropZoneStoreRef.current) {
    activeDropZoneStoreRef.current = createActiveDropZoneStore();
  }
  const activeDropZoneStore = activeDropZoneStoreRef.current;

  React.useEffect(() => {
    dragItemRef.current = dragItem;
  }, [dragItem]);

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
    activeDropZoneStore.emit(null);
  }, [activeDropZoneStore]);

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
    activeDropZoneStore.emit(id);
  }, [activeDropZoneStore]);

  React.useEffect(() => {
    if (!dragItem) return;

    const lastPointerRef = { current: null as { x: number; y: number } | null };
    const pendingNextZoneRef = { current: null as string | null };
    const pendingFrameCountRef = { current: 0 };
    let hitTestRafId: number | null = null;

    const scheduleHitTest = () => {
      if (hitTestRafId !== null) return;
      hitTestRafId = window.requestAnimationFrame(flushHitTest);
    };

    const flushHitTest = () => {
      hitTestRafId = null;
      const item = dragItemRef.current;
      const p = lastPointerRef.current;
      if (!item || !p) return;

      const next = resolveRegisteredDropZoneIdAtClientPoint(p.x, p.y, item, dropZonesRef.current);
      const current = activeDropZoneRef.current;

      if (next === current) {
        pendingNextZoneRef.current = null;
        pendingFrameCountRef.current = 0;
        return;
      }

      if (next === pendingNextZoneRef.current) {
        pendingFrameCountRef.current++;
      } else {
        pendingNextZoneRef.current = next;
        pendingFrameCountRef.current = 1;
      }

      if (pendingFrameCountRef.current >= 2) {
        pendingNextZoneRef.current = null;
        pendingFrameCountRef.current = 0;
        setActiveDropZoneSafe(next);
      } else {
        scheduleHitTest();
      }
    };

    const handleMove = (evt: Event) => {
      const p = getPointerFromMoveEvent(evt);
      if (!p) return;
      lastPointerRef.current = p;
      scheduleHitTest();
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      if (hitTestRafId !== null) {
        window.cancelAnimationFrame(hitTestRafId);
        hitTestRafId = null;
      }
    };
  }, [dragItem, setActiveDropZoneSafe]);

  React.useEffect(() => {
    if (!isDndDebugEnabled()) return;
    dndLog("state", {
      isDragging: dragItem !== null,
      activeDropZone: activeDropZoneStore.getSnapshot(),
      dragItemType: dragItem?.type,
      dragCardId: dragItem?.card?._id,
      dragSourceId: dragItem?.sourceId,
    });
  }, [dragItem, activeDropZoneStore]);

  const actionsValue = React.useMemo(
    () => ({
      startDrag,
      endDrag,
      registerDropZone,
      unregisterDropZone,
      setActiveDropZone: setActiveDropZoneSafe,
    }),
    [startDrag, endDrag, registerDropZone, unregisterDropZone, setActiveDropZoneSafe]
  );

  const dragStateValue = React.useMemo(
    () => ({
      dragItem,
      isDragging: dragItem !== null,
    }),
    [dragItem]
  );

  return (
    <TcgDndActionsContext.Provider value={actionsValue}>
      <TcgDndDragStateContext.Provider value={dragStateValue}>
        <ActiveDropZoneStoreContext.Provider value={activeDropZoneStore}>
          {children}
          <DragOverlay />
        </ActiveDropZoneStoreContext.Provider>
      </TcgDndDragStateContext.Provider>
    </TcgDndActionsContext.Provider>
  );
}

export function useTcgDndActions(): TcgDndActionsContextValue {
  const ctx = React.useContext(TcgDndActionsContext);
  if (!ctx) {
    throw new Error("useTcgDndActions must be used within a TcgDndProvider");
  }
  return ctx;
}

export function useTcgDndDragState(): TcgDndDragStateContextValue {
  const ctx = React.useContext(TcgDndDragStateContext);
  if (!ctx) {
    throw new Error("useTcgDndDragState must be used within a TcgDndProvider");
  }
  return ctx;
}

export function useActiveDropZoneIsOver(id: string): boolean {
  const store = React.useContext(ActiveDropZoneStoreContext);
  if (!store) {
    throw new Error("useActiveDropZoneIsOver must be used within a TcgDndProvider");
  }
  const getSnapshot = React.useCallback(() => store.getSnapshot() === id, [store, id]);
  return React.useSyncExternalStore(store.subscribe, getSnapshot, getIsOverServerSnapshot);
}

export function useTcgDnd(): TcgDndContextValue {
  const actions = React.useContext(TcgDndActionsContext);
  const dragState = React.useContext(TcgDndDragStateContext);
  const store = React.useContext(ActiveDropZoneStoreContext);
  if (!actions || !dragState || !store) {
    throw new Error("useTcgDnd must be used within a TcgDndProvider");
  }
  const activeDropZone = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getActiveDropZoneServerSnapshot
  );
  return React.useMemo(
    () => ({
      ...actions,
      ...dragState,
      activeDropZone,
    }),
    [actions, dragState, activeDropZone]
  );
}
