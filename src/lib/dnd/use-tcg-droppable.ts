"use client";

import * as React from "react";
import {
  UNIVERSUS_CARD_DND_ENABLED,
  TCG_DROP_ZONE_DATA_ATTR,
  useTcgDndActions,
  useTcgDndDragState,
  useActiveDropZoneIsOver,
  DropZoneConfig,
  DragItem,
} from "./tcg-dnd-provider";

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
    [K in typeof TCG_DROP_ZONE_DATA_ATTR]?: string;
  } & {
    "data-drop-active": boolean;
    "data-can-drop": boolean;
  };
}

const disabledDroppableResult: UseTcgDroppableResult = {
  isOver: false,
  canDrop: false,
  droppableProps: {
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
  const { registerDropZone, unregisterDropZone } = useTcgDndActions();
  const { dragItem, isDragging } = useTcgDndDragState();
  const isOver = useActiveDropZoneIsOver(id);

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

  const droppableProps = React.useMemo(
    () => ({
      [TCG_DROP_ZONE_DATA_ATTR]: id,
      "data-drop-active": isOver,
      "data-can-drop": canDrop,
    }),
    [id, isOver, canDrop]
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
