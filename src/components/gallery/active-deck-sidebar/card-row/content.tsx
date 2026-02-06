"use client";

import { cn } from "@/lib/utils";
import { ActiveDeckCardRowControls } from "./controls";
import { ActiveDeckCardRowProvider, useActiveDeckCardRowContext } from "./context";
import { ActiveDeckCardRowThumbnail } from "./thumbnail";
import type { ActiveDeckCardRowProps } from "./types";

function ActiveDeckCardRowContent() {
  const {
    card,
    count,
    dragHandleProps,
    handlePointerEnter,
    handlePointerMove,
    isDragging,
    onHoverLeave,
  } = useActiveDeckCardRowContext();

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition",
        "hover:border-primary/20 hover:bg-primary/5",
        isDragging && "opacity-60"
      )}
      style={{
        ...dragHandleProps.style,
        cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
      }}
      data-slot="deck-card-row"
      onMouseDown={dragHandleProps.onMouseDown}
      onTouchStart={dragHandleProps.onTouchStart}
      onDragStart={(event) => event.preventDefault()}
      onMouseEnter={(event) => {
        handlePointerEnter(event.currentTarget.getBoundingClientRect());
      }}
      onMouseMove={(event) => {
        handlePointerMove(event.currentTarget.getBoundingClientRect());
      }}
      onMouseLeave={onHoverLeave}
    >
      <ActiveDeckCardRowThumbnail />

      <div className="min-w-0 flex-1 transition-all duration-200 group-hover:pr-24">
        <p className="truncate text-xs font-medium">{card.name}</p>
      </div>

      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-opacity duration-150 group-hover:opacity-0">
        x{count}
      </span>

      <ActiveDeckCardRowControls />
    </div>
  );
}

export function ActiveDeckCardRow(props: ActiveDeckCardRowProps) {
  return (
    <ActiveDeckCardRowProvider {...props}>
      <ActiveDeckCardRowContent />
    </ActiveDeckCardRowProvider>
  );
}
