"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
import { ActiveDeckCardRowControls } from "./controls";
import { ActiveDeckCardRowProvider, useActiveDeckCardRowContext } from "./context";
import { ActiveDeckCardRowThumbnail } from "./thumbnail";
import type { ActiveDeckCardRowProps } from "./types";

function ActiveDeckCardRowContent() {
  const {
    card,
    backCard,
    count,
    dragHandleProps,
    handleCardClick,
    handlePointerEnter,
    handlePointerMove,
    isDialogOpen,
    isDragging,
    onHoverLeave,
    setIsDialogOpen,
  } = useActiveDeckCardRowContext();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick]
  );

  return (
    <>
      <div
        className={cn(
          "group relative flex min-h-9 cursor-pointer items-stretch overflow-hidden rounded-sm border border-border/30 bg-card/20 transition",
          "hover:border-primary/30 hover:bg-primary/6",
          isDragging && "opacity-60"
        )}
        style={{
          ...dragHandleProps.style,
          cursor: isDragging ? "grabbing" : "pointer",
        }}
        data-slot="deck-card-row"
        role="button"
        tabIndex={0}
        onMouseDown={dragHandleProps.onMouseDown}
        onTouchStart={dragHandleProps.onTouchStart}
        onDragStart={(event) => event.preventDefault()}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={(event) => {
          handlePointerEnter(event.currentTarget.getBoundingClientRect());
        }}
        onMouseMove={(event) => {
          handlePointerMove(event.currentTarget.getBoundingClientRect());
        }}
        onMouseLeave={onHoverLeave}
      >
      <ActiveDeckCardRowThumbnail />

      <div className="min-w-0 flex flex-1 items-center px-2.5 py-1.5 transition-all duration-200 group-hover:pr-24">
        <p className="truncate text-xs font-medium leading-tight">{card.name}</p>
      </div>

      <span className="flex items-center px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-opacity duration-150 group-hover:opacity-0">
        x{count}
      </span>

      <ActiveDeckCardRowControls />
    </div>

    <CardDetailsDialog
      card={card}
      backCard={backCard ?? undefined}
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    />
    </>
  );
}

export function ActiveDeckCardRow(props: ActiveDeckCardRowProps) {
  return (
    <ActiveDeckCardRowProvider {...props}>
      <ActiveDeckCardRowContent />
    </ActiveDeckCardRowProvider>
  );
}
