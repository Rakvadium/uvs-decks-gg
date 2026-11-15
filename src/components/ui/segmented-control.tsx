"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SegmentedControlSize = "xs" | "sm" | "md";
type SegmentedControlOrientation = "horizontal" | "vertical";

export interface SegmentedControlItem {
  value: string;
  label: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  badge?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

type SegmentedControlSelection =
  | { value?: string; onValueChange?: (value: string) => void; values?: never; onToggle?: never }
  | { values: readonly string[]; onToggle: (value: string) => void; value?: never; onValueChange?: never };

type SegmentedControlProps = SegmentedControlSelection & {
  items: SegmentedControlItem[];
  orientation?: SegmentedControlOrientation;
  size?: SegmentedControlSize;
  stretch?: boolean;
  className?: string;
  itemClassName?: string;
  "aria-label"?: string;
};

const SIZE_STYLES: Record<SegmentedControlSize, { height: string; item: string; badge: string }> = {
  xs: { height: "h-(--control-h-xs)", item: "px-2 text-[11px]", badge: "px-1 text-[10px]" },
  sm: { height: "h-(--control-h-sm)", item: "px-3 text-xs", badge: "px-1 py-0.5 text-[10px]" },
  md: { height: "h-(--control-h-md)", item: "px-4 text-xs", badge: "px-1.5 py-0.5 text-[10px]" },
};

export function SegmentedControl({
  items,
  value,
  onValueChange,
  values,
  onToggle,
  orientation = "horizontal",
  size = "md",
  stretch = false,
  className,
  itemClassName,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  const sizeStyles = SIZE_STYLES[size];
  const vertical = orientation === "vertical";
  const fillRow = !vertical && stretch;
  const isSelected = (itemValue: string) => (values ? values.includes(itemValue) : value === itemValue);
  const select = (itemValue: string) => (onToggle ? onToggle(itemValue) : onValueChange?.(itemValue));

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "overflow-hidden rounded-control border border-surface bg-muted-soft backdrop-blur-sm",
        vertical
          ? "flex w-full flex-col"
          : cn("items-stretch", sizeStyles.height, fillRow ? "flex w-full" : "inline-flex justify-center"),
        className
      )}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = isSelected(item.value);
        const isLast = index === items.length - 1;

        return (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            onClick={() => select(item.value)}
            aria-label={item.ariaLabel}
            className={cn(
              "inline-flex items-center justify-center gap-2 chrome-label-case outline-none transition-colors duration-150",
              "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              vertical
                ? cn("w-full justify-start border-b border-surface", sizeStyles.height, isLast && "border-b-0")
                : cn("border-r border-surface", isLast && "border-r-0", fillRow && "min-w-0 flex-1"),
              "disabled:pointer-events-none disabled:opacity-50",
              sizeStyles.item,
              isActive
                ? "bg-(--selected-bg) text-(--selected-fg)"
                : "text-muted-foreground hover:bg-(--hover-bg) hover:text-foreground",
              itemClassName
            )}
            aria-pressed={isActive}
            data-state={isActive ? "on" : "off"}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
            <span className={cn("min-w-0", vertical ? "flex-1 text-left" : "")}>{item.label}</span>
            {item.trailingIcon}
            {item.badge !== undefined && item.badge !== null ? (
              <span
                className={cn(
                  "shrink-0 rounded-control",
                  isActive ? "bg-(--selected-bg)" : "bg-muted",
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
