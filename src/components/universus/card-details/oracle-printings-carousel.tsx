"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";

interface OraclePrintingsCarouselProps {
  oracleId: string | undefined;
  selectedCardId: string;
  onSelectPrinting: (card: CachedCard) => void;
  className?: string;
}

export function OraclePrintingsCarousel({
  oracleId,
  selectedCardId,
  onSelectPrinting,
  className,
}: OraclePrintingsCarouselProps) {
  const printings = useQuery(
    api.cards.getCardVariants,
    oracleId ? { oracleId } : "skip"
  );

  const items = useMemo(() => printings ?? [], [printings]);

  if (!oracleId || items.length <= 1) {
    return null;
  }

  return (
    <div
      className={cn("w-full max-w-[340px]", className)}
      role="region"
      aria-label="Card printings"
    >
      <div className="flex w-full justify-center">
        <div className="flex w-max max-w-full gap-2 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:thin]">
          {printings === undefined
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] w-[52px] shrink-0 animate-pulse rounded-lg bg-muted/50"
                />
              ))
            : items.map((c) => {
                const selected = c._id === selectedCardId;
                const printingLabel = [c.setCode, c.collectorNumber].filter(Boolean).join(" · ") || "printing";
                const ariaLabel = [
                  "Select printing",
                  c.name,
                  printingLabel !== "printing" ? printingLabel : null,
                  c.isVariant === true ? "alt art" : null,
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <button
                    key={c._id}
                    type="button"
                    aria-label={ariaLabel}
                    onClick={() => onSelectPrinting(c)}
                    className="group flex w-[52px] shrink-0 flex-col gap-1 text-left"
                  >
                    <div
                      className={cn(
                        "relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg border-2 bg-muted/30 transition-colors",
                        selected ? "border-primary" : "border-border/50 hover:border-primary/40"
                      )}
                    >
                      {c.imageUrl ? (
                        <Image
                          src={c.imageUrl}
                          alt=""
                          fill
                          sizes="52px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    {c.isVariant === true ? (
                      <span className="text-center text-[8px] font-mono uppercase tracking-wider text-amber-500/90">
                        Alt
                      </span>
                    ) : null}
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}
