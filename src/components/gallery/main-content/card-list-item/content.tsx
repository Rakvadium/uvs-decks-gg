"use client";

import { CardDetailsDialog } from "@/components/universus";
import { useCardNavigation } from "@/components/universus/card-details/navigation-context";
import { cn } from "@/lib/utils";
import { CardDeckControlsCompact } from "../card-deck-controls";
import { CardListItemProvider, useCardListItemContext } from "./context";
import { CardListItemDetails } from "./details";
import { CardListItemThumbnail } from "./thumbnail";
import type { CardListItemProps } from "./types";

function CardListItemContent() {
  const {
    backCard,
    card,
    dragHandleProps,
    handleKeyDown,
    handleOpen,
    isDialogOpen,
    isDragging,
    setIsDialogOpen,
  } = useCardListItemContext();
  const nav = useCardNavigation();

  return (
    <>
      <div
        className={cn(
          "group flex min-h-[84px] w-full items-center gap-4 rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-foreground",
          "shadow-[var(--chrome-card-image-glow-rest)]",
          "[contain:layout_paint] transition-all duration-150 hover:border-[var(--chrome-card-border-hover)] hover:bg-card/70 hover:shadow-[var(--chrome-card-image-glow-hover)]",
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
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <CardListItemThumbnail />
        <CardListItemDetails />

        <CardDeckControlsCompact
          card={card}
          onClick={(event) => {
            event.stopPropagation();
          }}
        />
      </div>

      <CardDetailsDialog
        card={card}
        backCard={backCard}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        cards={nav?.cards}
        getBackCard={nav?.getBackCard}
      />
    </>
  );
}

export function CardListItem(props: CardListItemProps) {
  return (
    <CardListItemProvider {...props}>
      <CardListItemContent />
    </CardListItemProvider>
  );
}
