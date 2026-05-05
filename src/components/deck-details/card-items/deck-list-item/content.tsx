"use client";

import { cn } from "@/lib/utils";
import { CardDetailsDialog } from "@/components/universus/card-details/dialog";
import { DeckListItemActions } from "./actions";
import { DeckListItemProvider, useDeckListItemContext } from "./context";
import { DeckListItemDetails } from "./details";
import { DeckListItemThumbnail } from "./thumbnail";
import type { DeckListItemProps } from "./types";

function DeckListItemContent() {
  const {
    backCard,
    card,
    isDialogOpen,
    openDialog,
    handleKeyDownOpen,
    onHoverCard,
    onClearHover,
    setIsDialogOpen,
    zoneTintClass,
  } = useDeckListItemContext();

  return (
    <>
      <div
        className={cn(
          "group relative flex w-full max-w-full cursor-pointer overflow-hidden text-foreground transition",
          "min-h-9 items-stretch rounded-sm border border-border/30 bg-card/20",
          "hover:border-primary/30 hover:bg-primary/6",
          "md:min-h-[56px] md:items-center md:gap-2.5 md:rounded-xl md:border-border/50 md:bg-card/50 md:px-2.5 md:py-1.5",
          "md:shadow-[0_0_14px_-12px_var(--primary)] md:hover:border-primary/40 md:hover:bg-card/70",
          zoneTintClass
        )}
        onClick={openDialog}
        onKeyDown={handleKeyDownOpen}
        onMouseEnter={(event) => onHoverCard(card, event.currentTarget.getBoundingClientRect())}
        onMouseMove={(event) => onHoverCard(card, event.currentTarget.getBoundingClientRect())}
        onMouseLeave={onClearHover}
        role="button"
        tabIndex={0}
      >
        <DeckListItemThumbnail />
        <div className="flex min-w-0 flex-1 items-center gap-1 px-2 py-1 md:p-0 md:gap-2.5">
          <DeckListItemDetails />
          <DeckListItemActions />
        </div>
      </div>

      <CardDetailsDialog card={card} backCard={backCard} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}

export function DeckListItem(props: DeckListItemProps) {
  return (
    <DeckListItemProvider {...props}>
      <DeckListItemContent />
    </DeckListItemProvider>
  );
}
