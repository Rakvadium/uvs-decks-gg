"use client";

import { Crown } from "lucide-react";
import { isCyberpunkLegendType } from "@shared/games/cyberpunk/card-types";
import { normalizeCyberpunkSetup } from "@shared/games/cyberpunk/setup";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GameCardSetupActionProps } from "@/games/types";
import { useDeckEditor } from "@/lib/deck";
import { useCardIndex } from "@/lib/universus/card-data-provider";
import { cn } from "@/lib/utils";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { resolveLegendAdd } from "./legend-model";

/** Card details toggle: put a Legend into (or take it out of) the deck's Legend slots. */
export function CyberpunkSetLegendButton({ card, compact, className }: GameCardSetupActionProps) {
  const { hasDeck, deck, updateDeck } = useDeckEditor();
  const cardIndex = useCardIndex();

  if (!hasDeck || !isCyberpunkLegendType(card.type)) return null;

  const legendIds = normalizeCyberpunkSetup(deck).legendIds;
  const isLegend = legendIds.includes(card._id);
  const resolution = isLegend ? null : resolveLegendAdd(card, legendIds, (id) => cardIndex?.byId.get(id));
  const blockedReason = resolution?.kind === "blocked" ? resolution.message : null;

  const toggle = () => {
    const next = isLegend
      ? legendIds.filter((id) => id !== card._id)
      : resolution?.kind === "add"
        ? resolution.legendIds
        : null;
    if (!next) return;
    updateDeck({ setup: { game: "cyberpunk", legendIds: next as Id<"cards">[] } });
  };

  const label = isLegend
    ? compact ? "Legend" : "In Your Legends"
    : compact ? "Set Legend" : "Set As Legend";

  const button = (
    <Button
      type="button"
      variant={isLegend ? "default" : "outline"}
      size={compact ? "sm" : "default"}
      onClick={toggle}
      disabled={Boolean(blockedReason)}
      aria-pressed={isLegend}
      className={cn(
        "gap-2 transition-colors",
        isLegend
          ? "border-primary/40 bg-primary/20 text-primary hover:bg-primary/20"
          : "border-primary/40 text-muted-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
        className
      )}
    >
      <Crown className={cn("h-4 w-4", isLegend && "fill-primary")} aria-hidden />
      <span className="chrome-label-case text-xs">{label}</span>
    </Button>
  );

  if (!blockedReason) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Disabled buttons don't fire pointer events; the span carries the tooltip. */}
        <span tabIndex={0} className="inline-flex">
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-60 text-xs">{blockedReason}</TooltipContent>
    </Tooltip>
  );
}
