"use client";

import { useMemo } from "react";
import { AlertTriangle, Cpu } from "lucide-react";
import { Kicker } from "@/components/ui/typography-headings";
import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import { SymbolIcon } from "../color-pip";
import { buildRamBudgetSummary } from "./ram-budget-model";

interface RamBudgetSummaryProps {
  legends: readonly CachedCard[];
  mainQuantities: Readonly<Record<string, number>> | undefined;
  getCard: (id: string) => CachedCard | null | undefined;
  className?: string;
}

/**
 * Per color: RAM the Legends provide, main-deck cards of that color, and how many copies break
 * the budget (no Legend of the color, or RAM above it).
 */
export function RamBudgetSummary({ legends, mainQuantities, getCard, className }: RamBudgetSummaryProps) {
  const summary = useMemo(() => {
    const entries: { card: CachedCard; quantity: number }[] = [];
    for (const [id, quantity] of Object.entries(mainQuantities ?? {})) {
      const card = getCard(id);
      if (card && quantity > 0) entries.push({ card, quantity });
    }
    return buildRamBudgetSummary(legends, entries);
  }, [legends, mainQuantities, getCard]);

  return (
    <section aria-label="RAM budget" className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Kicker size="meta" className="inline-flex items-center gap-1">
          <Cpu className="h-3 w-3" aria-hidden />
          RAM budget
        </Kicker>
        {summary.overBudgetCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {summary.overBudgetCount} over
          </span>
        ) : null}
      </div>

      {summary.rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Choose Legends to set your RAM per color.</p>
      ) : (
        <ul className="space-y-1">
          {summary.rows.map((row) => {
            const over = row.overBudgetCount > 0;
            return (
              <li
                key={row.color}
                className={cn(
                  "rounded-md border px-2 py-1.5",
                  over ? "border-destructive/40 bg-destructive/10" : "border-border/40 bg-background/30"
                )}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <SymbolIcon symbol={row.color} size="xs" showLabel className="min-w-0 font-medium" />
                  <span className="shrink-0 tabular-nums">
                    <span className="font-bold text-foreground">{row.budget}</span>
                    <span className="text-muted-foreground"> RAM</span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] tabular-nums text-muted-foreground">
                  <span>
                    {row.cardCount} {row.cardCount === 1 ? "card" : "cards"}
                    {row.cardCount > 0 ? ` · max ${row.maxRam}` : ""}
                  </span>
                  {over ? (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-destructive">
                      <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
                      {row.budget > 0 ? `${row.overBudgetCount} above ${row.budget}` : `${row.overBudgetCount} need a ${row.label} Legend`}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
