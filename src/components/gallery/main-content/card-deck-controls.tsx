import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CachedCard } from "@/lib/universus/card-store";
import { useCardMainDeckControls } from "./use-card-main-deck-controls";

interface CardDeckControlsProps {
  card: CachedCard;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  compact?: boolean;
}

function CardDeckControlsBase({ card, onClick, compact = false }: CardDeckControlsProps) {
  const { hasDeck, deckCount, canAddToDeck, addToDeck, removeFromDeck } = useCardMainDeckControls(card);

  if (!hasDeck) return null;

  const iconClassName = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const countClassName = compact
    ? "w-8 text-center font-mono text-xs font-bold text-primary"
    : "w-8 text-center font-mono font-bold text-primary";

  return (
    <div className="flex items-center gap-1" data-no-drag>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={(event) => {
          onClick?.(event);
          removeFromDeck();
        }}
        disabled={deckCount === 0}
        className="border-destructive/30 hover:border-destructive hover:bg-destructive/10"
      >
        <Minus className={`${iconClassName} text-destructive`} />
      </Button>
      <span className={countClassName}>{deckCount}</span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={(event) => {
          onClick?.(event);
          addToDeck();
        }}
        disabled={!canAddToDeck}
        className="border-primary/30 hover:border-primary hover:bg-primary/10"
      >
        <Plus className={`${iconClassName} text-primary`} />
      </Button>
    </div>
  );
}

export function CardDeckControlsCompact({ card, onClick }: Omit<CardDeckControlsProps, "compact">) {
  return <CardDeckControlsBase card={card} compact onClick={onClick} />;
}

export function CardDeckControlsStandard({ card, onClick }: Omit<CardDeckControlsProps, "compact">) {
  return <CardDeckControlsBase card={card} onClick={onClick} />;
}
