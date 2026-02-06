"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CardDeckActions } from "./deck-actions";
import { CardDeckCountBadge } from "./deck-count-badge";
import { CardFlipControl } from "./flip-control";
import { useCardGridItemContext } from "./context";

export function CardGridItemFrame({ children }: { children: ReactNode }) {
  const {
    dragHandleProps,
    handleCardClick,
    handleKeyDown,
    isDragging,
    isHovered,
    prefersReducedMotion,
    setIsHovered,
  } = useCardGridItemContext();

  return (
    <div
      className={cn(
        "group relative aspect-[2.5/3.5] cursor-pointer [perspective:1000px]",
        prefersReducedMotion ? "transition-none" : "transition-all duration-300",
        isHovered && !prefersReducedMotion && "z-10 scale-105",
        isDragging && "scale-[0.98] opacity-60"
      )}
      style={{
        ...dragHandleProps.style,
        cursor: isDragging ? "grabbing" : dragHandleProps.style.cursor,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onDragStart={(event) => event.preventDefault()}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      onMouseDown={dragHandleProps.onMouseDown}
      onTouchStart={dragHandleProps.onTouchStart}
    >
      <div
        className={cn(
          "absolute -inset-1 rounded-xl bg-gradient-to-r from-primary via-secondary to-primary blur-md transition-opacity duration-300",
          isHovered ? "opacity-40" : "opacity-0"
        )}
      />

      {children}
      <CardFlipControl />
      <CardDeckCountBadge />
      <CardDeckActions />
    </div>
  );
}
