"use client";

import type { GameCardDetailsContentProps } from "@/games/types";
import { cn } from "@/lib/utils";
import { CyberpunkCardReadout } from "./readout";

/** Inline card details panel (gallery details view). */
export function CardDetailsContent({ card, className }: GameCardDetailsContentProps) {
  return (
    <div className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain", className)}>
      <CyberpunkCardReadout card={card} className="pr-5 md:pr-8" />
    </div>
  );
}
