"use client";

import { cn } from "@/lib/utils";
import { CardDetailsDialog } from "@/components/universus";
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
          "group flex min-h-[56px] w-full items-center gap-2.5 rounded-xl border border-border/50 bg-card/50 px-2.5 py-1.5 text-foreground",
          "shadow-[0_0_14px_-12px_var(--primary)]",
          "transition-colors hover:border-primary/40 hover:bg-card/70",
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
        <DeckListItemDetails />
        <DeckListItemActions />
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
