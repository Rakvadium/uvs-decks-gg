import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeckListItemContext } from "./context";

export function DeckListItemActions() {
  const { addCard, canAdd, card, isOwner, quantity, removeCard, section } = useDeckListItemContext();

  if (!isOwner) return null;

  return (
    <div className="flex shrink-0 items-center gap-0.5 md:gap-1" onClick={(event) => event.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => removeCard(card._id, section)}
        disabled={quantity <= 0}
        aria-label="Remove one"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-[26px] text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        x{quantity}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => addCard(card._id, section)}
        disabled={!canAdd}
        aria-label="Add one"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
