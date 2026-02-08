import { Badge } from "@/components/ui/badge";
import { SymbolIcon } from "../symbol-icon";
import { useCardDetailsContent } from "./content-context";

export function CardDetailsTitleSection() {
  const { card, symbols, showRarity } = useCardDetailsContent();

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-display font-bold uppercase tracking-wide">{card.name}</h2>
        {card.collectorNumber ? (
          <span className="shrink-0 text-xs font-mono text-muted-foreground">#{card.collectorNumber}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {card.type ? <Badge variant="cyber">{card.type}</Badge> : null}
        {showRarity ? <Badge variant="outline">{card.rarity}</Badge> : null}
        {card.setName ? <Badge variant="secondary">{card.setName}</Badge> : null}

        {symbols.length > 0 ? (
          <>
            <div className="mx-1 h-4 w-px bg-border/50" />
            <div className="flex items-center gap-1.5">
              {symbols.map((symbol) => (
                <div
                  key={symbol}
                  className="transition-transform hover:scale-110"
                  title={symbol.charAt(0).toUpperCase() + symbol.slice(1)}
                >
                  <SymbolIcon symbol={symbol} size="md" />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
