import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCardGridItemContext } from "./context";

export function CardDeckActions() {
  const { hasDeck, isHovered, deckCount, canAddToDeck, removeFromDeck, addToDeck } = useCardGridItemContext();

  if (!hasDeck || !isHovered) return null;

  return (
    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-destructive/40 bg-background/80 backdrop-blur-sm hover:border-destructive hover:bg-destructive/20 hover:shadow-[0_0_10px_var(--destructive)]"
            onClick={removeFromDeck}
            disabled={deckCount === 0}
          >
            <Minus className="h-4 w-4 text-destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="font-mono text-xs uppercase tracking-wider">
          <p>Remove</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-primary/40 bg-background/80 backdrop-blur-sm hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_10px_var(--primary)]"
            onClick={addToDeck}
            disabled={!canAddToDeck}
          >
            <Plus className="h-4 w-4 text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="font-mono text-xs uppercase tracking-wider">
          <p>Add</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
