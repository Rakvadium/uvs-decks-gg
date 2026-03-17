import { RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CardFlipButtonProps {
  isFlipped: boolean;
  isHovered: boolean;
  disabled?: boolean;
  prefersReducedMotion: boolean;
  onFlip: (e: React.MouseEvent) => void;
}

export function CardFlipButton({ isFlipped, isHovered, disabled, prefersReducedMotion, onFlip }: CardFlipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onFlip}
          disabled={disabled}
          className={cn(
            "absolute left-0 top-0 z-30 flex h-7 w-7 items-center justify-center",
            "rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none",
            "bg-background/80 backdrop-blur-sm",
            "border-r border-b border-border/40",
            "transition-all duration-200",
            "hover:bg-primary/10 hover:border-primary/40",
            isHovered ? "opacity-100" : "opacity-50"
          )}
          aria-label={isFlipped ? "View Front" : "View Back"}
        >
          <RotateCcw
            className={cn(
              "h-3 w-3 text-primary",
              prefersReducedMotion ? "" : "transition-transform duration-150",
              isFlipped && "rotate-180"
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
        <p>{isFlipped ? "View Front" : "View Back"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
