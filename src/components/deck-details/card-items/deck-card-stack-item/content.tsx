"use client";

import type { KeyboardEvent } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CardDetailsDialog } from "@/components/universus";
import { cn } from "@/lib/utils";
import { useDeckCardStackItemModel } from "./hook";
import type { DeckCardStackItemProps } from "./types";

export function DeckCardStackItem(props: DeckCardStackItemProps) {
  const {
    backCard,
    card,
    handleKeyDownOpen,
    isDialogOpen,
    openDialog,
    prefersReducedMotion,
    quantity,
    setIsDialogOpen,
    stackedLayers,
    stackOffset,
  } = useDeckCardStackItemModel(props);

  return (
    <>
      <div className="group flex flex-col gap-2">
        <div className="relative pb-6 pr-6">
          <div className="relative aspect-[2.5/3.5] overflow-visible">
            {stackedLayers.map((layer) => (
              <div
                key={layer}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-lg border border-border/80 bg-muted/70 ring-1 ring-white/10 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.7)]"
                style={{
                  transform: `translate(${layer * stackOffset}px, ${layer * stackOffset}px)`,
                  opacity: Math.max(0.55, 0.9 - layer * 0.08),
                }}
              />
            ))}

            <button
              type="button"
              onClick={openDialog}
              onKeyDown={handleKeyDownOpen as unknown as (event: KeyboardEvent<HTMLButtonElement>) => void}
              className={cn(
                "absolute inset-0 z-10 overflow-hidden rounded-lg",
                "shadow-[0_10px_30px_-16px_rgba(0,0,0,0.7)]",
                "transition-transform duration-150",
                !prefersReducedMotion && "group-hover:-translate-x-1 group-hover:-translate-y-1"
              )}
              aria-label={`Open ${card.name} details`}
            >
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  className="object-cover"
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center border border-border/50 bg-muted/50">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded border border-primary/30">
                      <span className="text-lg text-primary/50">?</span>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">No Image</span>
                  </div>
                </div>
              )}
            </button>

            <div className="absolute right-2 top-2 z-20">
              <Badge variant="outline" className="bg-background/80 font-mono text-[10px] backdrop-blur-sm">
                x{quantity}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <CardDetailsDialog card={card} backCard={backCard} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
