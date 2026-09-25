"use client";

import { Plus, X } from "lucide-react";
import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import { cyberpunkCardTitle } from "../../config";
import { SymbolIcon } from "../color-pip";
import { LegendArt } from "./legend-art";

interface LegendSlotProps {
  index: number;
  card: CachedCard | null;
  editable: boolean;
  /** `row`: art left + text (hero); `tile`: art on top + name (sidebar grid). */
  layout: "row" | "tile";
  onPick: (index: number) => void;
  onRemove: (index: number) => void;
  onOpenCard: (card: CachedCard) => void;
}

function LegendMeta({ card }: { card: CachedCard }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground">
      {card.color ? <SymbolIcon symbol={card.color} size="xs" /> : null}
      <span>
        <span className="font-semibold text-foreground">{typeof card.ram === "number" ? card.ram : "–"}</span> RAM
      </span>
    </span>
  );
}

/** One of the deck's Legend slots: the chosen Legend (open / remove) or an empty "Add Legend" slot. */
export function LegendSlot({ index, card, editable, layout, onPick, onRemove, onOpenCard }: LegendSlotProps) {
  const slotLabel = `Legend ${index + 1}`;

  if (!card) {
    return (
      <button
        type="button"
        disabled={!editable}
        onClick={() => onPick(index)}
        aria-label={editable ? `Add ${slotLabel}` : `${slotLabel}: empty`}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border/80 bg-background/30 text-[11px] text-muted-foreground",
          "transition-colors enabled:hover:border-primary/60 enabled:hover:bg-primary/10 enabled:hover:text-primary disabled:cursor-default",
          layout === "row" ? "h-14 w-full" : "aspect-[2.5/3.5] w-full flex-col"
        )}
      >
        {editable ? <Plus className="h-3.5 w-3.5" aria-hidden /> : null}
        <span className="chrome-label-case">{editable ? "Add Legend" : "Empty"}</span>
      </button>
    );
  }

  const { title, subname } = cyberpunkCardTitle(card);
  const removeButton = editable ? (
    <button
      type="button"
      onClick={() => onRemove(index)}
      aria-label={`Remove ${title} from Legends`}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
        layout === "tile" && "absolute right-1 top-1 z-10 bg-background/80 backdrop-blur-sm"
      )}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  ) : null;

  if (layout === "tile") {
    return (
      <div className="relative min-w-0">
        <button
          type="button"
          onClick={() => onOpenCard(card)}
          aria-label={`View ${title} details`}
          className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LegendArt card={card} sizes="96px" className="ring-1 ring-border/50" />
          <span className="mt-1 block truncate text-[11px] font-semibold leading-tight">{title}</span>
          <LegendMeta card={card} />
        </button>
        {editable ? (
          <button
            type="button"
            onClick={() => onPick(index)}
            className="mt-0.5 text-[10px] text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
          >
            Change
          </button>
        ) : null}
        {removeButton}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/30 p-1.5">
      <button
        type="button"
        onClick={() => onOpenCard(card)}
        aria-label={`View ${title} details`}
        className="w-10 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <LegendArt card={card} sizes="40px" />
      </button>
      <button
        type="button"
        disabled={!editable}
        onClick={() => onPick(index)}
        aria-label={editable ? `Change ${slotLabel} (${title})` : title}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <span className="block truncate text-xs font-semibold leading-tight">{title}</span>
        {subname ? <span className="block truncate text-[10px] text-muted-foreground">{subname}</span> : null}
        <LegendMeta card={card} />
      </button>
      {removeButton}
    </div>
  );
}
