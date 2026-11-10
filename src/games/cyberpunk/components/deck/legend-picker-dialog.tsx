"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Check, Loader2, Search, XIcon } from "lucide-react";
import { CYBERPUNK_COLORS } from "@shared/games/cyberpunk/card-types";
import { CYBERPUNK_LEGEND_COUNT, normalizeCyberpunkSetup } from "@shared/games/cyberpunk/setup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { GameSetupCardPickerDialogProps } from "@/games/types";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { cyberpunkCardTitle } from "../../config";
import { SymbolBadge, SymbolIcon } from "../color-pip";
import { LegendArt } from "./legend-art";
import { applyLegendPick, buildLegendPickerOptions } from "./legend-model";

/**
 * Legend picker: Legend cards only, name search, color filter. Without `slotIndex` it toggles
 * Legends in and out (stays open); with one it fills/replaces that slot and closes.
 */
export function LegendPickerDialog({ open, onOpenChange, setup, onChange, slotIndex }: GameSetupCardPickerDialogProps) {
  const { cards, isLoading } = useCardData();
  const cardMap = useCardIdMap(cards);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [colors, setColors] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const legendKey = normalizeCyberpunkSetup({ setup }).legendIds.join("|");
  const legendIds = useMemo(() => (legendKey ? legendKey.split("|") : []), [legendKey]);
  const replaceMode = typeof slotIndex === "number";
  const getCard = useCallback((id: string) => cardMap.get(id), [cardMap]);

  const options = useMemo(
    () =>
      buildLegendPickerOptions({
        cards,
        legendIds,
        getCard,
        search: deferredSearch,
        colors,
        slotIndex,
      }),
    [cards, legendIds, getCard, deferredSearch, colors, slotIndex]
  );

  const toggleColor = (color: string) =>
    setColors((prev) => (prev.includes(color) ? prev.filter((entry) => entry !== color) : [...prev, color]));

  const handlePick = async (cardId: Id<"cards">) => {
    setPendingId(cardId);
    try {
      await onChange({ game: "cyberpunk", legendIds: applyLegendPick(legendIds, cardId, slotIndex) as Id<"cards">[] });
      if (replaceMode) onOpenChange(false);
    } finally {
      setPendingId(null);
    }
  };

  const title = replaceMode ? `Choose Legend ${(slotIndex ?? 0) + 1}` : "Choose Legends";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        contentPadding="none"
        symmetricInset
        showCloseButton={false}
        className={cn(
          "flex max-h-[100dvh] flex-col gap-0 overflow-hidden overscroll-contain p-0",
          "md:max-h-[min(85dvh,52rem)] md:min-w-0 md:w-[min(96vw,64rem)] md:max-w-[min(96vw,64rem)]"
        )}
      >
        <DialogHeader className="sticky top-0 z-30 -mx-4 -mt-4 shrink-0 gap-3 border-b border-border/50 bg-card px-4 pb-3 pt-4 text-left sm:text-left md:-mx-6 md:-mt-6 md:px-6 md:pt-6">
          <div className="flex items-center gap-2">
            <DialogTitle className="min-w-0 flex-1 pr-2 text-lg leading-tight sm:text-xl">{title}</DialogTitle>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-live="polite">
              {legendIds.length}/{CYBERPUNK_LEGEND_COUNT} chosen
            </span>
            <DialogClose
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent opacity-70 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            A deck has {CYBERPUNK_LEGEND_COUNT} Legends with different names. Their RAM sets how much of each color you
            can play.
          </DialogDescription>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label="Filter by color" className="flex flex-wrap items-center gap-1">
              {CYBERPUNK_COLORS.map((color) => (
                <SymbolBadge
                  key={color}
                  symbol={color}
                  size="xs"
                  selected={colors.includes(color)}
                  onClick={() => toggleColor(color)}
                />
              ))}
            </div>
            <div className="relative min-w-0 w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Legends..."
                aria-label="Search Legends"
                className="min-w-0 pl-9"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[2.5/3.5] w-full rounded-lg" />
              ))}
            </div>
          ) : options.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border/80 bg-card/30 px-4 text-center text-sm text-muted-foreground">
              {cards.some((card) => card.type?.toLowerCase() === "legend")
                ? "No Legends match the current search and colors."
                : "No Legend cards are available yet."}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {options.map(({ card, selected, disabledReason }) => {
                const { title: cardTitle, subname } = cyberpunkCardTitle(card);
                const disabled = Boolean(disabledReason) || pendingId !== null;
                return (
                  <li key={card._id}>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      title={disabledReason ?? undefined}
                      onClick={() => void handlePick(card._id as Id<"cards">)}
                      className={cn(
                        "group relative block w-full rounded-lg p-1 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        selected ? "bg-primary/20" : "enabled:hover:bg-primary/10",
                        disabledReason && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <LegendArt
                        card={card}
                        sizes="(max-width: 640px) 45vw, 180px"
                        className={cn("ring-1", selected ? "ring-2 ring-primary" : "ring-border/50")}
                      />
                      {selected ? (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--chrome-elevation-low)]">
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      ) : null}
                      {pendingId === card._id ? (
                        <span className="absolute inset-1 flex items-center justify-center rounded-md bg-background/60">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </span>
                      ) : null}
                      <span className="mt-1.5 block truncate text-xs font-semibold">{cardTitle}</span>
                      <span className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                        <span className="truncate">{subname ?? " "}</span>
                        <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
                          {card.color ? <SymbolIcon symbol={card.color} size="xs" /> : null}
                          {typeof card.ram === "number" ? `${card.ram} RAM` : null}
                        </span>
                      </span>
                      {disabledReason ? (
                        <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">{disabledReason}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!replaceMode ? (
          <DialogFooter className="shrink-0 border-t border-border/50 pt-3">
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
