"use client";

import type { ReactNode } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { Kicker } from "@/components/ui/typography-headings";
import {
  MOBILE_INSET_DIVIDER,
  MOBILE_INSET_GROUP,
  MOBILE_INSET_ROW,
} from "@/components/shell/mobile-glass";
import { cn } from "@/lib/utils";

export function FilterGroup({
  label,
  trailing,
  children,
  className,
  fill = false,
  headerClassName,
}: {
  label?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
  fill?: boolean;
  headerClassName?: string;
}) {
  const showHeader = Boolean(label) || Boolean(trailing);

  return (
    <section className={cn(fill && "flex h-full flex-col", className)}>
      {showHeader ? (
        <div
          className={cn(
            "mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4",
            headerClassName
          )}
        >
          {label ? (
            <Kicker size="sm" tone="muted" className="block font-medium">
              {label}
            </Kicker>
          ) : null}
          {trailing ? <div className="flex flex-wrap items-center gap-x-2 gap-y-1">{trailing}</div> : null}
        </div>
      ) : null}
      <div className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER, fill && "min-h-0 flex-1")}>{children}</div>
    </section>
  );
}

export function FilterRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-4 py-3", className)}>{children}</div>;
}

export function FilterDrillRow({
  label,
  value,
  count,
  onClick,
  className,
}: {
  label: string;
  value: string;
  count?: number;
  onClick: () => void;
  className?: string;
}) {
  const hasValue = typeof count === "number" && count > 0;

  return (
    <button type="button" onClick={onClick} className={cn(MOBILE_INSET_ROW, "min-h-12", className)}>
      <span className="flex-1 font-medium">{label}</span>
      <span className={cn("truncate text-sm", hasValue ? "text-primary" : "text-muted-foreground")}>{value}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
    </button>
  );
}

export function FilterChip({
  label,
  selected,
  onClick,
  className,
}: {
  label: ReactNode;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-pill border px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 motion-safe:transition-[color,background-color,border-color,transform]",
        selected
          ? "border-primary-strong bg-primary-selected text-primary shadow-[var(--chrome-filter-tile-shadow-selected)]"
          : "border-surface bg-background-soft text-foreground hover:border-primary-soft hover:bg-muted-elevated",
        className
      )}
    >
      {selected ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function FilterChipRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

export function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label}`}
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-pill border border-primary-soft bg-primary-selected pl-3 pr-2 text-xs font-medium text-primary transition-colors duration-150 hover:border-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="max-w-[10rem] truncate">{label}</span>
      <X className="size-3.5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

export function FilterOptionRow({
  label,
  meta,
  selected,
  onToggle,
}: {
  label: string;
  meta?: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onToggle}
      className={cn(MOBILE_INSET_ROW, "min-h-12", selected && "text-primary")}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50 bg-background"
        )}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
        <span className="w-full truncate font-medium">{label}</span>
        {meta ? <span className="w-full truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
    </button>
  );
}
