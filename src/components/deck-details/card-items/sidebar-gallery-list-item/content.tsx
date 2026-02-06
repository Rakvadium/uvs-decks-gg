"use client";

import { cn } from "@/lib/utils";
import { CardDetailsDialog } from "@/components/universus";
import { SidebarGalleryListItemActions } from "./actions";
import {
  SidebarGalleryListItemProvider,
  useSidebarGalleryListItemContext,
} from "./context";
import { SidebarGalleryListItemDetails } from "./details";
import { SidebarGalleryListItemThumbnail } from "./thumbnail";
import type { SidebarGalleryListItemProps } from "./types";

function SidebarGalleryListItemContent() {
  const {
    backCard,
    canOpenDialog,
    card,
    dragHandleProps,
    handleKeyDownOpen,
    handleOpen,
    isDialogOpen,
    isDragging,
    onClearHover,
    onHoverCard,
    setIsDialogOpen,
  } = useSidebarGalleryListItemContext();

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-2 py-2 transition-colors",
          "hover:border-primary/30 hover:bg-card/70",
          isDragging && "opacity-60"
        )}
        style={{
          ...dragHandleProps.style,
          cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
        }}
        onMouseDown={dragHandleProps.onMouseDown}
        onTouchStart={dragHandleProps.onTouchStart}
        onDragStart={(event) => event.preventDefault()}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (!canOpenDialog()) return;
          handleKeyDownOpen(event);
        }}
        onMouseEnter={() => onHoverCard(card)}
        onMouseMove={() => onHoverCard(card)}
        onMouseLeave={onClearHover}
        role="button"
        tabIndex={0}
      >
        <SidebarGalleryListItemThumbnail />
        <SidebarGalleryListItemDetails />
        <SidebarGalleryListItemActions />
      </div>

      <CardDetailsDialog card={card} backCard={backCard} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}

export function SidebarGalleryListItem(props: SidebarGalleryListItemProps) {
  return (
    <SidebarGalleryListItemProvider {...props}>
      <SidebarGalleryListItemContent />
    </SidebarGalleryListItemProvider>
  );
}
