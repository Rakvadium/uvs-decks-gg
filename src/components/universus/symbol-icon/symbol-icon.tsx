"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { SIZE_MAP } from "./constants";
import type { SymbolIconProps } from "./types";
import { getSymbolPath } from "./utils";

export function SymbolIcon({ symbol, size = "sm", className, showLabel = false }: SymbolIconProps) {
  const path = getSymbolPath(symbol);
  const pixelSize = SIZE_MAP[size];

  if (!path) {
    return <span className={cn("text-xs", className)}>{symbol}</span>;
  }

  const isAttuned = symbol.toLowerCase().startsWith("attuned");
  const displayName = isAttuned ? symbol.replace(/^attuned[:-]/i, "").trim() : symbol;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Image src={path} alt={symbol} width={pixelSize} height={pixelSize} className="object-contain" />
      {showLabel ? (
        <span className="text-xs capitalize">
          {isAttuned ? <span className="text-muted-foreground">Attuned </span> : null}
          {displayName}
        </span>
      ) : null}
    </span>
  );
}
