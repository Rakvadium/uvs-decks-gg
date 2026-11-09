"use client";

import { useMemo } from "react";
import { ImageOff, X } from "lucide-react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { useTcgDraggable } from "@/lib/dnd";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TierListUnknownCardDisplay } from "./lane-map-sync";

const TILE_CLASS = "aspect-[2.5/3.5] w-full rounded-xl";

/**
 * Stands in for a placed card the catalog has no entry for, at the same size as a card tile, so
 * every counted card is visible. A skeleton while the catalog may still bring the card, otherwise
 * an "Unavailable card" tile the owner can drag to another lane or remove.
 */
export function CommunityTierListUnknownCardTile({
  cardId,
  display,
  dragSourceId,
  canEdit,
  onRemove,
}: {
  cardId: Id<"cards">;
  display: TierListUnknownCardDisplay;
  dragSourceId: string;
  canEdit: boolean;
  onRemove: () => void;
}) {
  if (display === "loading") {
    return <Skeleton role="img" aria-label="Loading card" className={TILE_CLASS} />;
  }

  return (
    <UnavailableCardTile cardId={cardId} dragSourceId={dragSourceId} canEdit={canEdit} onRemove={onRemove} />
  );
}

function UnavailableCardTile({
  cardId,
  dragSourceId,
  canEdit,
  onRemove,
}: {
  cardId: Id<"cards">;
  dragSourceId: string;
  canEdit: boolean;
  onRemove: () => void;
}) {
  // Lane drops only read the dragged card's id.
  const dragCard = useMemo(() => ({ _id: cardId, name: "Unavailable card" }) as unknown as Doc<"cards">, [cardId]);
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card: dragCard,
    sourceId: dragSourceId,
    isDisabled: !canEdit,
  });

  return (
    <div
      role="group"
      aria-label="Unavailable card"
      className={cn(
        TILE_CLASS,
        "relative flex flex-col items-center justify-center gap-2 border border-dashed border-surface bg-muted-soft p-3 text-center",
        isDragging && "opacity-60"
      )}
      onMouseDown={canEdit ? dragHandleProps.onMouseDown : undefined}
      onTouchStart={canEdit ? dragHandleProps.onTouchStart : undefined}
      style={canEdit ? { ...dragHandleProps.style, cursor: isDragging ? "grabbing" : "grab" } : undefined}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary-soft">
        <ImageOff className="h-4 w-4 text-primary/60" aria-hidden />
      </div>
      <span className="chrome-label-case text-xs font-semibold text-foreground">Unavailable card</span>
      <span className="text-xs text-muted-foreground">Not in the card catalog</span>
      {canEdit ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-1.5 top-1.5 h-7 w-7"
          aria-label="Remove unavailable card"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
