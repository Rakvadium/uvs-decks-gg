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

  const iconClassName = compact ? "h-3.5 w-3.5 stroke-[2.5]" : "h-4 w-4 stroke-[2.5]";
  const countClassName = compact
    ? "w-8 text-center font-mono text-xs font-bold tabular-nums text-foreground"
    : "w-8 text-center font-mono font-bold tabular-nums text-foreground";

  return (
    <div className="flex items-center gap-1" data-no-drag>
      <Button
        variant="destructiveOutline"
        size="icon-sm"
        onClick={(event) => {
          onClick?.(event);
          removeFromDeck();
        }}
        disabled={deckCount === 0}
        className="disabled:opacity-60"
      >
        <Minus className={iconClassName} />
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
        className="border-primary/55 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20 disabled:opacity-60"
      >
        <Plus className={iconClassName} />
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
