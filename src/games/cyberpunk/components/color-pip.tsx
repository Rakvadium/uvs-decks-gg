"use client";

import type { GameSymbolBadgeProps, GameSymbolIconProps } from "@/games/types";
import { cn } from "@/lib/utils";
import { getCyberpunkColorHex, getCyberpunkColorLabel } from "../config";

const PIP_SIZE = { xs: "size-2.5", sm: "size-3", md: "size-4", lg: "size-5" } as const;

function Pip({ symbol, size }: { symbol: string; size: keyof typeof PIP_SIZE }) {
  const hex = getCyberpunkColorHex(symbol);
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full ring-1 ring-inset ring-white/25", PIP_SIZE[size])}
      style={{ backgroundColor: hex, boxShadow: `0 0 6px ${hex}99` }}
    />
  );
}

/** Color pip (Cyberpunk "symbols" are card colors). */
export function SymbolIcon({ symbol, size = "sm", className, showLabel = false }: GameSymbolIconProps) {
  const label = getCyberpunkColorLabel(symbol);
  return (
    <span className={cn("inline-flex items-center gap-1", className)} title={label}>
      <Pip symbol={symbol} size={size} />
      {showLabel ? <span className="text-xs">{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}

export function SymbolBadge({ symbol, selected, onClick, size = "sm", className }: GameSymbolBadgeProps) {
  const label = getCyberpunkColorLabel(symbol);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={label}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors",
        selected ? "border-primary/60 bg-primary/10" : "border-border/50 bg-background hover:bg-muted",
        className
      )}
    >
      <Pip symbol={symbol} size={size} />
      <span>{label}</span>
    </button>
  );
}
