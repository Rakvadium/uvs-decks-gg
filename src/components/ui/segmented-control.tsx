"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SegmentedControlSize = "sm" | "md";
type SegmentedControlOrientation = "horizontal" | "vertical";

export interface SegmentedControlItem {
  value: string;
  label: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  badge?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps {
  items: SegmentedControlItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: SegmentedControlOrientation;
  size?: SegmentedControlSize;
  className?: string;
  itemClassName?: string;
}

const SIZE_STYLES: Record<
  SegmentedControlSize,
  { container: string; item: string; badge: string }
> = {
  sm: {
    container: "gap-1 p-0.5",
    item: "px-3 py-1.5 text-xs",
    badge: "px-1 py-0.5 text-[10px]",
  },
  md: {
    container: "gap-1 p-1",
    item: "px-3 py-2 text-[11px]",
    badge: "px-1.5 py-0.5 text-[10px]",
  },
};

export function SegmentedControl({
  items,
  value,
  onValueChange,
  orientation = "horizontal",
  size = "md",
  className,
  itemClassName,
}: SegmentedControlProps) {
  const sizeStyles = SIZE_STYLES[size];

  return (
    <div
      className={cn(
        "tab-container inline-flex rounded-lg border border-border/50 bg-muted/50 backdrop-blur-sm",
        orientation === "vertical" ? "tab-container-vertical flex-col w-full" : "items-center justify-center",
        sizeStyles.container,
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            onClick={() => onValueChange?.(item.value)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md border border-transparent font-mono uppercase tracking-wider transition-all",
              orientation === "vertical" ? "w-full justify-start" : "",
              "disabled:pointer-events-none disabled:opacity-50",
              sizeStyles.item,
              isActive
                ? "bg-primary/20 text-primary shadow-[0_0_10px_-3px_var(--primary)]"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              itemClassName
            )}
            aria-pressed={isActive}
            data-state={isActive ? "on" : "off"}
          >
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
            <span className={cn("min-w-0", orientation === "vertical" ? "flex-1 text-left" : "")}>{item.label}</span>
            {item.trailingIcon}
            {item.badge !== undefined && item.badge !== null ? (
              <span
                className={cn(
                  "shrink-0 rounded",
                  isActive ? "bg-primary/30" : "bg-muted",
                  sizeStyles.badge
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
