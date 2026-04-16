"use client";

import { Minus, Plus } from "lucide-react";
import { useChromeMode } from "@/providers/ColorSchemeProvider";
import { cn } from "@/lib/utils";

interface CardDeckControlsProps {
  deckCount: number;
  isHovered: boolean;
  canAdd: boolean;
  onAdd: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  showQuantity?: boolean;
  forceSolidSurface?: boolean;
}

export function CardDeckControls({
  deckCount,
  isHovered,
  canAdd,
  onAdd,
  onRemove,
  showQuantity = true,
  forceSolidSurface = false,
}: CardDeckControlsProps) {
  const chromeMode = useChromeMode();
  const frosted = !forceSolidSurface && chromeMode === "expressive";
  const showButtons = isHovered;
  const showCount = showQuantity ? deckCount > 0 || showButtons : showButtons;

  if (!showCount) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-0 right-0 z-30 flex flex-col items-center overflow-hidden",
        "rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none",
        "border-l border-t border-border/40 shadow-sm",
        frosted ? "bg-background/80 backdrop-blur-sm" : "bg-background/92"
      )}
    >
      {showButtons && (
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={cn(
            "pointer-events-auto flex h-6 w-7 items-center justify-center",
            "text-primary transition-colors duration-150",
            "hover:bg-primary/10",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            !showQuantity && "border-b border-border/40"
          )}
          aria-label="Add to deck"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}

      {showQuantity ? (
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
      ) : null}

      {showButtons && (
        <button
          type="button"
          onClick={onRemove}
          disabled={deckCount === 0}
          className={cn(
            "pointer-events-auto flex h-6 w-7 items-center justify-center",
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
