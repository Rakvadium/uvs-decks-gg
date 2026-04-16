import type { CachedCard } from "@/lib/universus/card-store";
import { CardImageDisplay } from "@/components/universus/card-grid-item/image-display";
import { cn } from "@/lib/utils";

interface TierListPreviewGridProps {
  cards: CachedCard[];
  className?: string;
  emptyLabel?: string;
}

export function TierListPreviewGrid({
  cards,
  className,
  emptyLabel = "Slot",
}: TierListPreviewGridProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {cards.length > 0
        ? cards.map((card) => (
            <div
              key={card._id}
              className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg border border-border/50"
            >
              <CardImageDisplay imageUrl={card.imageUrl} name={card.name} />
            </div>
          ))
        : Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex aspect-[2.5/3.5] items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/30 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground"
            >
              {emptyLabel}
            </div>
          ))}
    </div>
  );
}
