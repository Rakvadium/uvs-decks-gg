"use client";

import * as React from "react";
import {
  UNIVERSUS_CARD_DND_ENABLED,
  useTcgDnd,
  DropZoneConfig,
  DragItem,
} from "./tcg-dnd-provider";

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

export interface UseTcgDroppableOptions {
  id: string;
  accepts: DragItem["type"][];
  onDrop: (item: DragItem) => void;
  isDisabled?: boolean;
}

export interface UseTcgDroppableResult {
  isOver: boolean;
  canDrop: boolean;
  droppableProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    "data-drop-active": boolean;
    "data-can-drop": boolean;
  };
}

const disabledDroppableResult: UseTcgDroppableResult = {
  isOver: false,
  canDrop: false,
  droppableProps: {
    onMouseEnter: () => {},
    onMouseLeave: () => {},
    onPointerEnter: () => {},
    onPointerLeave: () => {},
    "data-drop-active": false,
    "data-can-drop": false,
  },
};

export function useTcgDroppable({
  id,
  accepts,
  onDrop,
  isDisabled = false,
}: UseTcgDroppableOptions): UseTcgDroppableResult {
  const { 
    registerDropZone, 
    unregisterDropZone, 
    dragItem, 
    isDragging,
    activeDropZone,
    setActiveDropZone,
  } = useTcgDnd();

  const isOver = activeDropZone === id;
  const canDrop = isDragging && dragItem !== null && accepts.includes(dragItem.type) && !isDisabled;

  React.useEffect(() => {
    if (!UNIVERSUS_CARD_DND_ENABLED) return;
    const config: DropZoneConfig = {
      id,
      accepts,
      onDrop,
      isDisabled,
    };
    registerDropZone(config);
    return () => unregisterDropZone(id);
  }, [id, accepts, onDrop, isDisabled, registerDropZone, unregisterDropZone]);

  const handleMouseEnter = React.useCallback(() => {
    if (isDragging && canDrop) {
      dndLog("droppable.enter", { id, canDrop, dragItemType: dragItem?.type, dragCardId: dragItem?.card?._id });
      setActiveDropZone(id);
    }
  }, [isDragging, canDrop, setActiveDropZone, id, dragItem]);

  const handleMouseLeave = React.useCallback(() => {
    if (activeDropZone === id) {
      dndLog("droppable.leave", { id });
      setActiveDropZone(null);
    }
  }, [activeDropZone, setActiveDropZone, id]);

  const droppableProps = React.useMemo(
    () => ({
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onPointerEnter: handleMouseEnter,
      onPointerLeave: handleMouseLeave,
      "data-drop-active": isOver,
      "data-can-drop": canDrop,
    }),
    [handleMouseEnter, handleMouseLeave, isOver, canDrop]
  );

  return React.useMemo(() => {
    if (!UNIVERSUS_CARD_DND_ENABLED) return disabledDroppableResult;
    return {
      isOver,
      canDrop,
      droppableProps,
    };
  }, [isOver, canDrop, droppableProps]);
}
