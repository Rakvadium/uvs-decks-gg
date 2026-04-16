import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Hexagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import type { CachedCard } from "@/lib/universus";
import { cn } from "@/lib/utils";
import { DeckSectionControls } from "./deck-section-controls";

interface CardDetailsImagePanelProps {
  displayCard: CachedCard;
  deckCard: CachedCard;
  hasBack: boolean;
  isFlipped: boolean;
  onToggleFlip: () => void;
}

export function CardDetailsImagePanel({
  displayCard,
  deckCard,
  hasBack,
  isFlipped,
  onToggleFlip,
}: CardDetailsImagePanelProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative flex shrink-0 items-center justify-center bg-gradient-to-br from-background via-card to-background p-6 lg:sticky lg:top-0 lg:w-[320px] lg:self-start">
      <div className="absolute inset-0" style={{ background: "var(--chrome-deck-details-wash)" }} />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

      <div className="relative z-10 w-full max-w-[250px]">
        <motion.div className="relative aspect-[2.5/3.5] w-full" style={{ perspective: 1000 }}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={isFlipped ? "back" : "front"}
              initial={false}
              animate={prefersReducedMotion ? {} : { rotateY: 0, opacity: 1 }}
              exit={prefersReducedMotion ? {} : { rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-hidden rounded-xl"
              style={{ boxShadow: "var(--chrome-card-image-glow-rest)" }}
            >
              {displayCard.imageUrl ? (
                <Image src={displayCard.imageUrl} alt={displayCard.name} fill className="object-cover" priority />
              ) : (
                <div className="flex h-full w-full items-center justify-center border border-border/50 bg-muted/50">
                  <div className="text-center">
                    <Hexagon className="mx-auto mb-2 h-12 w-12 text-primary/30" />
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      No Image
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="absolute -inset-px -z-10 rounded-xl blur-[3px]" style={{ background: "var(--chrome-card-frame-halo)", opacity: "var(--chrome-card-frame-halo-hover-opacity)" }} />
        </motion.div>

        <div className="mt-4 flex items-center justify-center gap-2">
          {hasBack && (
            <Button variant="outline" size="sm" onClick={onToggleFlip} className="gap-2">
              <RotateCcw
                className={cn(
                  "h-4 w-4",
                  !prefersReducedMotion && "transition-transform duration-150",
                  isFlipped && "rotate-180"
                )}
              />
              <span className="text-xs font-mono uppercase tracking-wider">{isFlipped ? "Front" : "Back"}</span>
            </Button>
          )}
        </div>

        <DeckSectionControls card={deckCard} />
      </div>
    </div>
  );
}
