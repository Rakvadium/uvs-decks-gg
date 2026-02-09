import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCardGridItemContext } from "./context";

export function CardDeckActions() {
  const { hasDeck, isHovered, isMobile, deckCount, canAddToDeck, removeFromDeck, addToDeck } = useCardGridItemContext();

  if (!hasDeck || (!isHovered && !isMobile)) return null;

  const removeAction = (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "border-destructive/40 bg-background/80 backdrop-blur-sm hover:border-destructive hover:bg-destructive/20 hover:shadow-[0_0_10px_var(--destructive)]",
        isMobile ? "h-8 w-8" : "h-9 w-9"
      )}
      onClick={removeFromDeck}
      disabled={deckCount === 0}
    >
      <Minus className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", "text-destructive")} />
    </Button>
  );

  const addAction = (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "border-primary/40 bg-background/80 backdrop-blur-sm hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_10px_var(--primary)]",
        isMobile ? "h-8 w-8" : "h-9 w-9"
      )}
      onClick={addToDeck}
      disabled={!canAddToDeck}
    >
      <Plus className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", "text-primary")} />
    </Button>
  );

  if (isMobile) {
    return (
      <div
        className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-1.5 py-1 backdrop-blur-sm"
        data-no-drag
      >
        {removeAction}
        <span className="w-8 text-center font-mono text-xs font-bold text-primary">{deckCount}</span>
        {addAction}
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>{removeAction}</TooltipTrigger>
        <TooltipContent className="font-mono text-xs uppercase tracking-wider">
          <p>Remove</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>{addAction}</TooltipTrigger>
        <TooltipContent className="font-mono text-xs uppercase tracking-wider">
          <p>Add</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
