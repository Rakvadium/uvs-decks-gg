"use client";

import { Minus, Plus } from "lucide-react";
import { useChromeMode } from "@/providers/ColorSchemeProvider";
import { chromeHasNeonChrome } from "@/lib/theme/chrome-behavior";
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
  const frosted = !forceSolidSurface && chromeHasNeonChrome(chromeMode);
  const showButtons = isHovered;
  const showCount = showQuantity ? deckCount > 0 || showButtons : showButtons;

  if (!showCount) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-0 right-0 z-30 flex flex-col items-center overflow-hidden",
        "rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none",
        "border-l border-t border-border/70 shadow-md",
        frosted ? "bg-card/95 backdrop-blur-md" : "bg-card"
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
            "hover:bg-primary/15",
            "disabled:cursor-not-allowed disabled:text-muted-foreground",
            !showQuantity && "border-b border-border/60"
          )}
          aria-label="Add to deck"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      )}

      {showQuantity ? (
        <div
          className={cn(
            "flex h-6 w-7 items-center justify-center",
            "font-mono text-xs font-bold tabular-nums",
            showButtons && "border-t border-b border-border/60",
            deckCount > 0 ? "text-primary" : "text-foreground"
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
            "hover:bg-destructive/15",
            "disabled:cursor-not-allowed disabled:text-muted-foreground"
          )}
          aria-label="Remove from deck"
        >
          <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
