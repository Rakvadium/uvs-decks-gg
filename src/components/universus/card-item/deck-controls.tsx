import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardDeckControlsProps {
  deckCount: number;
  isHovered: boolean;
  canAdd: boolean;
  onAdd: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

export function CardDeckControls({ deckCount, isHovered, canAdd, onAdd, onRemove }: CardDeckControlsProps) {
  const showButtons = isHovered;
  const showCount = deckCount > 0 || showButtons;

  if (!showCount) return null;

  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 z-30 flex flex-col items-center overflow-hidden",
        "rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none",
        "bg-background/80 backdrop-blur-sm",
        "border-l border-t border-border/40",
        "transition-all duration-200"
      )}
    >
      {showButtons && (
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={cn(
            "flex h-6 w-7 items-center justify-center",
            "text-primary transition-colors duration-150",
            "hover:bg-primary/10",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Add to deck"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}

      <div
        className={cn(
          "flex h-6 w-7 items-center justify-center",
          "font-mono text-xs font-bold",
          showButtons && "border-t border-b border-border/40",
          deckCount > 0 ? "text-primary" : "text-muted-foreground"
        )}
      >
        {deckCount}
      </div>

      {showButtons && (
        <button
          type="button"
          onClick={onRemove}
          disabled={deckCount === 0}
          className={cn(
            "flex h-6 w-7 items-center justify-center",
            "text-destructive transition-colors duration-150",
            "hover:bg-destructive/10",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Remove from deck"
        >
          <Minus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
