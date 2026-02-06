import { Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CardDetailsRendererProps } from "./types";

export function DefaultDetails({
  cardData,
  deckCount,
  onAddToDeck,
  onRemoveFromDeck,
}: CardDetailsRendererProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Card Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Type:</span>
            <span>{cardData.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Rarity:</span>
            <span>{cardData.rarity}</span>
          </div>
          {cardData.attack ? (
            <div className="flex justify-between">
              <span className="font-medium">Attack:</span>
              <span>{cardData.attack}</span>
            </div>
          ) : null}
          {cardData.defense ? (
            <div className="flex justify-between">
              <span className="font-medium">Defense:</span>
              <span>{cardData.defense}</span>
            </div>
          ) : null}
          {cardData.cost ? (
            <div className="flex justify-between">
              <span className="font-medium">Cost:</span>
              <span>{cardData.cost}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-medium">Description</h4>
        <p className="text-sm text-muted-foreground">{cardData.description}</p>
      </div>

      <div className="flex justify-between">
        <span className="font-medium">In Deck:</span>
        <Badge>{deckCount}</Badge>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => onRemoveFromDeck?.(cardData.id)}
          disabled={deckCount === 0}
          variant="outline"
          className="flex-1"
        >
          <Minus className="mr-2 h-4 w-4" />
          Remove
        </Button>
        <Button onClick={() => onAddToDeck?.(cardData.id)} className="flex-1">
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
