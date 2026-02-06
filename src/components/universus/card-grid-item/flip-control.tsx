import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCardGridItemContext } from "./context";

export function CardFlipControl() {
  const {
    isHovered,
    isFlipped,
    hasBackCardId,
    hasBackCardData,
    prefersReducedMotion,
    handleFlip,
  } = useCardGridItemContext();

  if (!hasBackCardId) return null;

  return (
    <div
      className={cn(
        "absolute left-1.5 top-1.5 z-10 transition-all duration-200",
        isHovered ? "scale-100 opacity-100" : "scale-90 opacity-70"
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-primary/40 bg-background/80 backdrop-blur-sm hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_10px_var(--primary)]"
            onClick={handleFlip}
            disabled={!hasBackCardData}
          >
            <RotateCcw
              className={cn(
                "h-3.5 w-3.5 text-primary",
                prefersReducedMotion ? "" : "transition-transform duration-300",
                isFlipped && "rotate-180"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
          <p>{isFlipped ? "View Front" : "View Back"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
