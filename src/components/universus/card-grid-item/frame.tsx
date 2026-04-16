"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CardDeckActions } from "./deck-actions";
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
        prefersReducedMotion ? "transition-none" : "transition-[transform,opacity] duration-150",
        isDragging
          ? "z-20 scale-[0.98] opacity-60"
          : isHovered && !prefersReducedMotion && "z-10"
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
          "absolute -inset-px rounded-2xl blur-[2px] transition-opacity duration-150",
          isDragging ? "opacity-0" : isHovered ? "opacity-70" : "opacity-20"
        )}
        style={{
          background: "var(--chrome-card-frame-halo)",
          opacity: isDragging
            ? 0
            : isHovered
              ? "var(--chrome-card-frame-halo-hover-opacity, 0.7)"
              : undefined,
          boxShadow: isDragging
            ? "none"
            : isHovered
              ? "var(--chrome-card-frame-glow-hover)"
              : "var(--chrome-card-frame-glow-rest)",
        }}
      />

      {children}
      <CardFlipControl />
      <CardDeckActions />
    </div>
  );
}
