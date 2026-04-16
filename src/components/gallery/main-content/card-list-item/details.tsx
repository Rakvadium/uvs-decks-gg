import { Badge } from "@/components/ui/badge";
import { useCardListItemContext } from "./context";

export function CardListItemDetails() {
  const { card } = useCardListItemContext();

  return (
    <div className="min-w-0 flex-1">
      <div className="min-w-0 flex items-center gap-2">
        <p className="truncate text-sm font-semibold">{card.name}</p>
        {card.collectorNumber ? (
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">#{card.collectorNumber}</span>
        ) : null}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {card.type ? (
          <Badge tone="entity" className="border-primary/40 bg-card/40 backdrop-blur-none">
            {card.type}
          </Badge>
        ) : null}
        {card.setName ? <span className="truncate">{card.setName}</span> : null}
        {card.rarity ? <span>{card.rarity}</span> : null}
      </div>
    </div>
  );
}
