import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useDeckListItemContext } from "./context";

export function DeckListItemActions() {
  const deckDetails = useDeckDetailsOptional();
  const { addCard, canAdd, card, quantity, removeCard, section } = useDeckListItemContext();

  if (!deckDetails?.isOwner) return null;

  return (
    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => removeCard(card._id, section)}
        disabled={quantity <= 0}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-7 w-7"
        onClick={() => addCard(card._id, section)}
        disabled={!canAdd}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
