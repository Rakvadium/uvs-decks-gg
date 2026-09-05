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
}: {
  label: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3 px-4">
        <Kicker size="sm" tone="muted" className="block font-medium">
          {label}
        </Kicker>
        {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
      </div>
      <div className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER)}>{children}</div>
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
}: {
  label: string;
  value: string;
  count?: number;
  onClick: () => void;
}) {
  const hasValue = typeof count === "number" && count > 0;

  return (
    <button type="button" onClick={onClick} className={cn(MOBILE_INSET_ROW, "min-h-12")}>
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
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 motion-safe:transition-[color,background-color,border-color,transform]",
        selected
          ? "border-primary/50 bg-primary/20 text-primary shadow-[var(--chrome-filter-tile-shadow-selected)]"
          : "border-border/50 bg-background/60 text-foreground hover:border-primary/30 hover:bg-muted/60",
        className
      )}
    >
      {selected ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function FilterChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label}`}
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/15 pl-3 pr-2 text-xs font-medium text-primary transition-colors duration-150 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        {meta ? <span className="w-full truncate text-[11px] text-muted-foreground">{meta}</span> : null}
      </span>
    </button>
  );
}
