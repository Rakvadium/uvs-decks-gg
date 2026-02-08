import { useMemo, useState } from "react";
import Image from "next/image";
import { FileText, Hexagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDetailsContent, CardDetailsDialog } from "@/components/universus";
import { useCardNavigation } from "@/components/universus/card-details/navigation-context";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useTcgDraggable } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { CachedCard } from "@/lib/universus";
import { CardDeckControlsStandard } from "./card-deck-controls";
import { useGalleryCardMap } from "./card-map-context";

interface CardDetailsListItemProps {
  card: CachedCard;
}

export function CardDetailsListItem({ card }: CardDetailsListItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { getBackCard } = useGalleryCardMap();
  const nav = useCardNavigation();
  const backCard = getBackCard(card);
  const hasBack = Boolean(backCard);
  const displayCard = useMemo(() => (isFlipped && backCard ? backCard : card), [isFlipped, backCard, card]);
  const { isDragging, dragHandleProps } = useTcgDraggable({
    card,
    sourceId: "gallery-details",
  });

  return (
    <>
      <div
        className={cn("rounded-xl border border-border/40 bg-card/30 p-4 transition-all md:p-6", isDragging && "opacity-70")}
      >
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <div className="relative mx-auto w-full max-w-[260px] lg:mx-0">
              <div
                className={cn(
                  "relative aspect-[2.5/3.5] w-full overflow-hidden rounded-xl border border-border/50 bg-muted/40",
                  "shadow-[0_0_24px_-8px_var(--primary)/40]"
                )}
                style={{
                  ...dragHandleProps.style,
                  cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
                }}
                onMouseDown={dragHandleProps.onMouseDown}
                onTouchStart={dragHandleProps.onTouchStart}
                onDragStart={(event) => event.preventDefault()}
              >
                {displayCard.imageUrl ? (
                  <Image src={displayCard.imageUrl} alt={displayCard.name} fill className="object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center border border-border/50 bg-muted/50">
                    <div className="text-center">
                      <Hexagon className="mx-auto mb-2 h-10 w-10 text-primary/30" />
                      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">No Image</span>
                    </div>
                  </div>
                )}
              </div>
              {!prefersReducedMotion ? (
                <div className="absolute -inset-3 -z-10 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-2xl" />
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {hasBack ? (
                <Button variant="outline" size="sm" onClick={() => setIsFlipped((value) => !value)} className="gap-2">
                  <RotateCcw
                    className={cn(
                      "h-4 w-4",
                      !prefersReducedMotion && "transition-transform duration-300",
                      isFlipped && "rotate-180"
                    )}
                  />
                  <span className="text-xs font-mono uppercase tracking-wider">{isFlipped ? "Front" : "Back"}</span>
                </Button>
              ) : null}

              <CardDeckControlsStandard card={card} />

              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-mono uppercase tracking-wider">Open Dialog</span>
              </Button>
            </div>
          </div>

          <CardDetailsContent card={displayCard} className="overflow-visible p-0" />
        </div>
      </div>

      <CardDetailsDialog
        card={card}
        backCard={backCard}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        cards={nav?.cards}
        getBackCard={nav?.getBackCard}
      />
    </>
  );
}
