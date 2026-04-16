"use client";

import Image from "next/image";
import { Hexagon, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import {
  CardDetailsContentProvider,
} from "../content-context";
import {
  CardDetailsReadoutPanel,
  CardDetailsReadoutSurface,
} from "../readout-panel";
import type { CardDetailsVariantProps } from "./types";

export function CardDetailsV2({
  card,
  backCard,
  displayCard,
  hasBack,
  isFlipped,
  onToggleFlip,
  mobileNavigationPrevious,
  mobileNavigationNext,
}: CardDetailsVariantProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasBackFace = Boolean(backCard);
  const transitionClass = prefersReducedMotion ? "duration-0" : "duration-300 ease-out";
  const heroSizes = "(max-width: 768px) min(92vw, 340px), 340px";

  return (
    <CardDetailsContentProvider card={displayCard}>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 p-3 max-md:!pointer-events-none md:max-h-[min(85vh,calc(100dvh-2rem))] md:flex-row md:items-stretch md:gap-5 md:overflow-hidden md:pb-3 md:pl-3 md:!pointer-events-auto md:pr-14 md:pt-12">
        <div
          className={cn(
            "flex w-full shrink-0 flex-col items-center justify-center max-md:!pointer-events-auto",
            "lg:sticky lg:top-0 lg:w-[400px] lg:max-w-[400px] lg:self-start"
          )}
        >
          <div className="w-full">
            <div className="flex items-center justify-center gap-3">
              <div
                className={cn(
                  "shrink-0 justify-center md:hidden",
                  mobileNavigationPrevious ? "flex w-10" : "hidden"
                )}
              >
                {mobileNavigationPrevious}
              </div>
              <div className="w-full max-w-[260px] md:max-w-[340px]">
                <div className="relative aspect-[2.5/3.5] w-full" style={{ perspective: 1000 }}>
                  {!hasBackFace ? (
                    <div
                      className="absolute inset-0 overflow-hidden rounded-(--radius-2xl)"
                      style={{ boxShadow: "var(--chrome-card-image-glow-rest)" }}
                    >
                      {displayCard.imageUrl ? (
                        <Image
                          src={displayCard.imageUrl}
                          alt={displayCard.name}
                          fill
                          sizes={heroSizes}
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center border border-border/50 bg-muted/50">
                          <Hexagon className="h-12 w-12 text-primary/30" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "absolute inset-0 overflow-hidden rounded-(--radius-2xl) transition-opacity",
                          transitionClass,
                          isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
                        )}
                        style={{ boxShadow: "var(--chrome-card-image-glow-rest)" }}
                      >
                        {card.imageUrl ? (
                          <Image
                            src={card.imageUrl}
                            alt={card.name}
                            fill
                            sizes={heroSizes}
                            className="object-cover"
                            priority={!isFlipped}
                            loading={!isFlipped ? undefined : "lazy"}
                            fetchPriority={isFlipped ? "low" : undefined}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center border border-border/50 bg-muted/50">
                            <Hexagon className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          "absolute inset-0 overflow-hidden rounded-(--radius-2xl) transition-opacity",
                          transitionClass,
                          !isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
                        )}
                        style={{ boxShadow: "var(--chrome-card-image-glow-rest)" }}
                      >
                        {backCard!.imageUrl ? (
                          <Image
                            src={backCard!.imageUrl}
                            alt={backCard!.name}
                            fill
                            sizes={heroSizes}
                            className="object-cover"
                            priority={isFlipped}
                            loading={isFlipped ? undefined : "lazy"}
                            fetchPriority={!isFlipped ? "low" : undefined}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center border border-border/50 bg-muted/50">
                            <Hexagon className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {hasBack && (
                    <button
                      type="button"
                      onClick={onToggleFlip}
                      className="absolute bottom-0 right-0 z-10 flex items-center gap-2 rounded-none rounded-tl-(--radius-2xl) rounded-br-(--radius-2xl) border border-primary/35 bg-card/95 px-3 py-2 text-muted-foreground shadow-none backdrop-blur-sm transition-all hover:border-primary/50 hover:text-primary md:bottom-auto md:left-0 md:right-auto md:top-0"
                    >
                      <RotateCcw
                        className={cn(
                          "h-3.5 w-3.5",
                          !prefersReducedMotion &&
                            "transition-transform duration-150",
                          isFlipped && "rotate-180"
                        )}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-[0.15em]">
                        {isFlipped ? "Front" : "Back"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "shrink-0 justify-center md:hidden",
                  mobileNavigationNext ? "flex w-10" : "hidden"
                )}
              >
                {mobileNavigationNext}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-primary/25 bg-card/95 shadow-[0_0_2px_var(--primary)/35,0_0_10px_var(--primary)/42,0_0_22px_var(--primary)/12] backdrop-blur-md max-md:!pointer-events-auto">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="pointer-events-auto absolute top-0 right-0 z-30 h-9 w-9 rounded-none rounded-tr-xl rounded-bl-xl border-primary/35 bg-card/95 shadow-none backdrop-blur-sm md:hidden"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          <CardDetailsReadoutSurface className="min-h-0 flex-1">
            <CardDetailsReadoutPanel />
          </CardDetailsReadoutSurface>
        </div>
      </div>
    </CardDetailsContentProvider>
  );
}
