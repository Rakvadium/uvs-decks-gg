"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const SYMBOL_BASE_PATH = "/universus/symbols";

const SYMBOL_MAP: Record<string, string> = {
  air: "air.png",
  all: "all.png",
  chaos: "chaos.png",
  death: "death.png",
  earth: "earth.png",
  evil: "evil.png",
  fire: "fire.png",
  good: "good.png",
  life: "life.png",
  order: "order.png",
  void: "void.png",
  water: "water.png",
  infinity: "infinity.png",
};

const ATTUNED_SYMBOL_MAP: Record<string, string> = {
  air: "attuned-air.png",
  all: "attuned-all.png",
  chaos: "attuned-chaos.png",
  death: "attuned-death.png",
  earth: "attuned-earth.png",
  evil: "attuned-evil.png",
  fire: "attuned-fire.png",
  good: "attuned-good.png",
  life: "attuned-life.png",
  order: "attuned-order.png",
  void: "attuned-void.png",
  water: "attuned-water.png",
};

export function getSymbolPath(symbol: string): string | null {
  const normalizedSymbol = symbol.toLowerCase().trim();
  
  if (normalizedSymbol.startsWith("attuned:") || normalizedSymbol.startsWith("attuned-")) {
    const baseSymbol = normalizedSymbol.replace(/^attuned[:-]/, "");
    const filename = ATTUNED_SYMBOL_MAP[baseSymbol];
    return filename ? `${SYMBOL_BASE_PATH}/${filename}` : null;
  }
  
  const filename = SYMBOL_MAP[normalizedSymbol];
  return filename ? `${SYMBOL_BASE_PATH}/${filename}` : null;
}

export function isValidSymbol(symbol: string): boolean {
  return getSymbolPath(symbol) !== null;
}

interface SymbolIconProps {
  symbol: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const SIZE_MAP = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
};

export function SymbolIcon({ symbol, size = "sm", className, showLabel = false }: SymbolIconProps) {
  const path = getSymbolPath(symbol);
  const pixelSize = SIZE_MAP[size];
  
  if (!path) {
    return <span className={cn("text-xs", className)}>{symbol}</span>;
  }
  
  const isAttuned = symbol.toLowerCase().startsWith("attuned");
  const displayName = isAttuned 
    ? symbol.replace(/^attuned[:-]/i, "").trim()
    : symbol;
  
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Image
        src={path}
        alt={symbol}
        width={pixelSize}
        height={pixelSize}
        className="object-contain"
      />
      {showLabel && (
        <span className="text-xs capitalize">
          {isAttuned && <span className="text-muted-foreground">Attuned </span>}
          {displayName}
        </span>
      )}
    </span>
  );
}

interface SymbolBadgeProps {
  symbol: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function SymbolBadge({ symbol, selected, onClick, size = "sm", className }: SymbolBadgeProps) {
  const path = getSymbolPath(symbol);
  const pixelSize = SIZE_MAP[size];
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md border p-1.5 transition-colors",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:bg-muted",
        className
      )}
      title={symbol}
    >
      {path ? (
        <Image
          src={path}
          alt={symbol}
          width={pixelSize}
          height={pixelSize}
          className="object-contain"
        />
      ) : (
        <span className="text-xs">{symbol}</span>
      )}
    </button>
  );
}
