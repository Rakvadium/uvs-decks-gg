import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CardActionsOverlayProps {
  cardId: string;
  deckCount: number;
  onAddToDeck?: (cardId: string) => void;
  onRemoveFromDeck?: (cardId: string) => void;
}

export function CardActionsOverlay({
  cardId,
  deckCount,
  onAddToDeck,
  onRemoveFromDeck,
}: CardActionsOverlayProps) {
  return (
    <div className="absolute bottom-2 left-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveFromDeck?.(cardId);
            }}
            disabled={deckCount === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Remove from deck</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            onClick={(event) => {
              event.stopPropagation();
              onAddToDeck?.(cardId);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to deck</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
