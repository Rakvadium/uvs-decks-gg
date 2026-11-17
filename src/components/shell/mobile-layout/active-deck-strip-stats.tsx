"use client";

import { useMemo } from "react";
import { Kicker } from "@/components/ui/typography-headings";
import { useGameModule } from "@/games/game-context";
import { mainDeckTarget } from "@/games/main-deck-target";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { buildDeckEntriesFromQuantities } from "@/components/deck-details/deck-list-utils";
import { buildStackedCurve, type StackedCurve } from "@/lib/deck/stacked-curve";
import { cn } from "@/lib/utils";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";

/**
 * The active deck's main-deck count, per-type totals and the game's strip curves (UniVersus:
 * difficulty and check value) stacked by card type, with the game's card-type colours.
 */
function useActiveDeckStats() {
  const { activeDeck } = useActiveDeck();
  const gameModule = useGameModule();
  const { formatCardType, deckStats, deckStatsCharts, deckStripCurves } = gameModule.ui;
  const { cards } = useCardData();
  const cardMap = useCardIdMap(cards);

  const entries = useMemo(
    () => buildDeckEntriesFromQuantities(activeDeck?.mainQuantities ?? {}, cardMap),
    [activeDeck?.mainQuantities, cardMap]
  );

  return useMemo(() => {
    const typeOf = (card: (typeof entries)[number]["card"]) => formatCardType(card.type) ?? card.type ?? "Other";
    const typeTotals = new Map<string, number>();
    for (const { card, quantity } of entries) {
      typeTotals.set(typeOf(card), (typeTotals.get(typeOf(card)) ?? 0) + quantity);
    }
    const curves = deckStripCurves.flatMap(({ chartId, label, min, max }) => {
      const chart = deckStatsCharts.find((candidate) => candidate.id === chartId);
      if (!chart || chart.kind !== "numeric") return [];
      const curve = buildStackedCurve(entries, chart.value, typeOf, { min, max });
      return curve.columns.length > 0 ? [{ label, title: chart.title, curve }] : [];
    });
    return {
      hasDeck: Boolean(activeDeck),
      total: [...typeTotals.values()].reduce((sum, count) => sum + count, 0),
      target: mainDeckTarget(gameModule),
      types: [...typeTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
      curves,
      colorOf: (type: string) => deckStats.cardTypeColors[type] ?? deckStats.cardTypeColors.Other ?? "currentColor",
    };
  }, [activeDeck, entries, formatCardType, deckStats, deckStatsCharts, deckStripCurves, gameModule]);
}

interface StackedBarsProps {
  curve: StackedCurve;
  colorOf: (type: string) => string;
  /** Bar area height in px. */
  height: number;
  /** Fixed bar width (Tailwind class). Omit to stretch the bars across the available width. */
  barClassName?: string;
  /** Show each column's value under it. */
  axis?: boolean;
}

/**
 * One stacked curve: each column split by card type, most common type at the bottom. Every column
 * draws a faint full-height track, so a chart's footprint is the same whatever the deck holds.
 */
function StackedBars({ curve, colorOf, height, barClassName, axis = false }: StackedBarsProps) {
  const fill = !barClassName;
  const columnClass = fill ? "min-w-0 flex-1" : barClassName;

  return (
    <span className={cn("flex flex-col gap-1", fill ? "w-full" : "shrink-0")}>
      <span className={cn("flex items-end", fill ? "gap-1" : "gap-0.5")} style={{ height }}>
        {curve.columns.map((column) => (
          <span
            key={column.value}
            className={cn("flex h-full flex-col-reverse overflow-hidden rounded-t-[2px] bg-muted-tint", columnClass)}
          >
            {column.segments.map((segment) => (
              <span
                key={segment.type}
                className="block w-full shrink-0"
                style={{
                  height: Math.max(1.5, (segment.count / curve.max) * height),
                  backgroundColor: colorOf(segment.type),
                }}
              />
            ))}
          </span>
        ))}
      </span>
      {axis ? (
        <span className={cn("flex text-[10px] tabular-nums leading-none text-muted-foreground", fill ? "gap-1" : "gap-0.5")}>
          {curve.columns.map((column) => (
            <span key={column.value} className={cn("text-center", columnClass)}>
              {column.label}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}

function DeckCount({ total, target, className }: { total: number; target: number; className?: string }) {
  return (
    <span className={cn("shrink-0 font-semibold tabular-nums leading-none text-foreground", className)}>
      {total}
      <span className="font-medium text-muted-foreground">/{target}</span>
    </span>
  );
}

/** The Active Deck strip's stats line: card count, then the small stacked curves, evenly spaced. */
export function ActiveDeckStripStats() {
  const stats = useActiveDeckStats();
  if (!stats.hasDeck) return null;

  return (
    <span className="mt-1.5 flex min-w-0 items-end gap-4" aria-label={`${stats.total} of ${stats.target} cards`}>
      <DeckCount total={stats.total} target={stats.target} className="text-xs" />
      {stats.curves.map(({ label, curve }) => (
        <span key={label} className="flex shrink-0 items-end gap-1.5" aria-hidden>
          <Kicker size="meta" className="leading-none">
            {label}
          </Kicker>
          <StackedBars curve={curve} colorOf={stats.colorOf} height={22} barClassName="w-1.5" />
        </span>
      ))}
    </span>
  );
}

/**
 * The Active Deck panel's header summary (in place of the description): card count, the curves at
 * a readable size with value labels, and per-type counts with their colours.
 */
export function ActiveDeckStatsSummary() {
  const stats = useActiveDeckStats();
  // Nothing to chart yet (no main-deck cards): render nothing, so the host hides the section.
  if (!stats.hasDeck || (stats.curves.length === 0 && stats.types.length === 0)) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {stats.curves.map(({ label, title, curve }) => (
          <div key={label} className="min-w-0 space-y-2">
            <Kicker size="meta" className="block leading-none">
              {title}
            </Kicker>
            <StackedBars curve={curve} colorOf={stats.colorOf} height={44} axis />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] leading-none text-muted-foreground">
        {stats.types.map(([type, count]) => (
          <span key={type} className="inline-flex items-center gap-1 tabular-nums">
            <span aria-hidden className="size-2 rounded-[2px]" style={{ backgroundColor: stats.colorOf(type) }} />
            {count} {type}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The active deck's main-deck count against the format target, for the Active Deck panel header. */
export function ActiveDeckCount() {
  const stats = useActiveDeckStats();
  if (!stats.hasDeck) return null;
  return <DeckCount total={stats.total} target={stats.target} className="text-xs" />;
}
