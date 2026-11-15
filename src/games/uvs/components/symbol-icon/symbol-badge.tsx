"use client";

import Image from "next/image";
import { OptionTile } from "@/components/ui/option-tile";
import { cn } from "@/lib/utils";
import { SIZE_MAP } from "./constants";
import type { SymbolBadgeProps } from "./types";
import { getSymbolPath } from "./utils";

export function SymbolBadge({ symbol, selected, onClick, size = "sm", className }: SymbolBadgeProps) {
  const path = getSymbolPath(symbol);
  const pixelSize = SIZE_MAP[size];

  return (
    <OptionTile
      selected={Boolean(selected)}
      onClick={onClick}
      className={cn("inline-flex items-center justify-center p-1.5", className)}
      title={symbol}
    >
      {path ? (
        <Image src={path} alt={symbol} width={pixelSize} height={pixelSize} className="object-contain" />
      ) : (
        <span className="text-xs">{symbol}</span>
      )}
    </OptionTile>
  );
}
