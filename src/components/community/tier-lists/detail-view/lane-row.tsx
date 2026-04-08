"use client";

import { useState } from "react";
import type { BuilderTier } from "../types";
import { useTcgDroppable } from "@/lib/dnd";
import { CardGridItem } from "@/components/universus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCommunityTierListDetailContext } from "./context";
import { Check, Pencil, Trash2 } from "lucide-react";

function withAlpha(color: string, alpha: string) {
  if (color.startsWith("#") && color.length === 7) {
    return `${color}${alpha}`;
  }

  return color;
}

export function CommunityTierListLaneRow({ tier }: { tier: BuilderTier }) {
  const {
    laneMap,
    cardMap,
    canEdit,
    isRankedScope,
    moveCardToLane,
    setTierLabel,
    setTierColor,
    removeTier,
    tiers,
    getBackCard,
  } = useCommunityTierListDetailContext();
  const cardIds = laneMap[tier.id] ?? [];
  const [isEditingLane, setIsEditingLane] = useState(false);

  const { isOver, canDrop, droppableProps } = useTcgDroppable({
    id: `tier-list-${tier.id}`,
    accepts: canEdit ? ["card"] : [],
    onDrop: (item) => moveCardToLane(item.card._id, tier.id),
  });

  return (
    <div
      {...droppableProps}
      className={cn(
        "rounded-2xl border px-4 py-2.5 transition-all",
        canEdit && canDrop && "shadow-[0_0_20px_-15px_var(--primary)]",
        canEdit && isOver && "scale-[1.005]"
      )}
      style={{
        borderColor: canEdit && canDrop ? withAlpha(tier.color, "88") : withAlpha(tier.color, "44"),
        backgroundColor: canEdit && isOver ? withAlpha(tier.color, "20") : withAlpha(tier.color, "10"),
      }}
    >
      <div className="flex items-center gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {canEdit && !isRankedScope && isEditingLane ? (
            <input
              type="color"
              value={tier.color}
              onChange={(event) => setTierColor(tier.id, event.target.value)}
              className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-border/50 bg-transparent"
            />
          ) : null}

          {canEdit && !isRankedScope ? (
            <Button
              variant={isEditingLane ? "secondary" : "ghost"}
              size="icon-sm"
              className="h-7 w-7 shrink-0"
              onClick={() => setIsEditingLane((current) => !current)}
              aria-label={isEditingLane ? "Done editing tier lane" : "Edit tier lane"}
            >
              {isEditingLane ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          ) : null}

          {canEdit && !isRankedScope && isEditingLane ? (
            <Input
              value={tier.label}
              onChange={(event) => setTierLabel(tier.id, event.target.value)}
              className="h-7 min-w-0 max-w-36 bg-background/70 font-display text-sm font-bold uppercase tracking-[0.2em]"
            />
          ) : (
            <h3 className="truncate text-sm font-semibold uppercase tracking-[0.18em]" title={tier.label}>
              {tier.label}
            </h3>
          )}

          {canEdit && !isRankedScope && isEditingLane && tiers.length > 1 ? (
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 shrink-0" onClick={() => removeTier(tier.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <Badge variant="outline" className="ml-auto h-5 shrink-0 px-2 text-[9px] uppercase tracking-[0.18em]">
          {cardIds.length} cards
        </Badge>
      </div>

      <div className="mt-2 overflow-x-auto overflow-y-visible px-1 pt-1 pb-3">
        {cardIds.length > 0 ? (
          <div className="flex min-w-max gap-4">
            {cardIds.map((cardId) => {
              const card = cardMap.get(cardId.toString());
              if (!card) {
                return null;
              }

              return (
                <div key={card._id} className="w-32 shrink-0 md:w-36">
                  <CardGridItem
                    card={card}
                    backCard={getBackCard(card)}
                    dragSourceId={`tier-list:${tier.id}`}
                    showDeckActions={false}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-32 w-full items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/30 text-sm text-muted-foreground">
            {canEdit ? "Drag cards here" : "No cards in this lane"}
          </div>
        )}
      </div>
    </div>
  );
}
