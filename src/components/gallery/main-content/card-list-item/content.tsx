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
          "group flex min-h-[84px] w-full items-center gap-4 rounded-xl border border-primary/20 bg-card/50 px-4 py-3 text-foreground",
          "shadow-[0_0_0_1px_var(--primary)/20,0_0_5px_var(--primary)/40]",
          "[contain:layout_paint] transition-all duration-150 hover:border-primary/50 hover:bg-card/70 hover:shadow-[0_0_0_1px_var(--primary)/50,0_0_8px_var(--primary)/70,0_0_14px_var(--primary)/15]",
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
