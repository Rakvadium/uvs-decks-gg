"use client";

import Link from "next/link";
import { useRef, type ComponentType, type ReactNode } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSlashToFocus } from "@/hooks/use-slash-to-focus";
import { FloatingIslandCapsule } from "./floating-island";

export const FLOATING_ACTION_PILL_CLASS =
  "pointer-events-auto h-10 shrink-0 gap-1.5 rounded-full px-4 shadow-[0_4px_16px_-10px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_36px_-16px_rgba(0,0,0,0.75)]";

export function FloatingPageBar({
  left,
  center,
  right,
  className,
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none grid w-full min-w-0 grid-cols-[1fr_minmax(0,26rem)_1fr] items-center gap-3 py-0.5",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-start gap-2">{left}</div>
      <div className="flex min-w-0 justify-center">{center}</div>
      <div className="flex min-w-0 items-center justify-end gap-2">{right}</div>
    </div>
  );
}

export function FloatingPageLayout({
  bar,
  children,
  contentClassName,
}: {
  bar: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col md:h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden px-4 pt-3 md:block md:px-6">
        {bar}
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 md:pt-[4.75rem]",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

export interface FloatingTabItem {
  value: string;
  label: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  badge?: ReactNode;
  hideLabelBelowLg?: boolean;
}

export function FloatingTabsPill({
  items,
  value,
  onValueChange,
  className,
}: {
  items: FloatingTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <FloatingIslandCapsule
      className={cn("pointer-events-auto shrink-0", className)}
      bodyClassName="gap-0.5 px-1.5"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.value;
        const hideLabel = item.hideLabelBelowLg !== false;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onValueChange(item.value)}
            aria-pressed={isActive}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-mono text-[11px] uppercase tracking-wider transition-colors duration-150",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
            <span className={cn(hideLabel && "hidden lg:inline")}>{item.label}</span>
            {item.badge !== undefined && item.badge !== null && item.badge !== 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px]",
                  isActive ? "bg-primary/20" : "bg-muted/70"
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </FloatingIslandCapsule>
  );
}

export function FloatingSearchCapsule({
  value,
  onChange,
  placeholder,
  name,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  name: string;
  "aria-label": string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useSlashToFocus(inputRef);

  return (
    <FloatingIslandCapsule className={cn("pointer-events-auto min-w-0 w-full", className)}>
      <Search className="size-4 shrink-0 text-[color:var(--control-dual-mix)]" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full min-w-0 flex-1 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        name={name}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
      />
      {value.length > 0 ? (
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--control-dual-mix)] transition-colors hover:bg-[color:var(--control-dual-surface-hover)] hover:text-primary"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd className="hidden shrink-0 select-none items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground lg:flex">
          /
        </kbd>
      )}
    </FloatingIslandCapsule>
  );
}

export function FloatingBackPill({
  href,
  onClick,
  label,
  className,
  iconOnly = false,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  className?: string;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    const iconInnerClass =
      "flex size-full items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-xl transition-colors hover:bg-muted/60 hover:text-foreground";

    return (
      <div className={cn("pointer-events-auto relative size-11 shrink-0", className)}>
        <div
          className={cn(
            "relative size-11 rounded-full p-px transition-shadow duration-300",
            "bg-[linear-gradient(115deg,color-mix(in_oklch,var(--primary)_40%,transparent),color-mix(in_oklch,var(--border)_65%,transparent)_28%,color-mix(in_oklch,var(--border)_65%,transparent)_72%,color-mix(in_oklch,var(--secondary)_40%,transparent))]",
            "shadow-[0_4px_16px_-10px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_36px_-16px_rgba(0,0,0,0.75)]"
          )}
        >
          {href ? (
            <Link href={href} aria-label={label} className={iconInnerClass}>
              <ArrowLeft className="size-4" />
            </Link>
          ) : (
            <button type="button" onClick={onClick} aria-label={label} className={iconInnerClass}>
              <ArrowLeft className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const labelButtonClass =
    "h-8 gap-1.5 rounded-full px-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/60 hover:text-foreground";

  return (
    <FloatingIslandCapsule
      className={cn("pointer-events-auto shrink-0", className)}
      bodyClassName="gap-0 px-1.5"
      glow={false}
    >
      {href ? (
        <Button variant="ghost" size="sm" className={labelButtonClass} asChild>
          <Link href={href}>
            <ArrowLeft className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className={labelButtonClass} onClick={onClick}>
          <ArrowLeft className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      )}
    </FloatingIslandCapsule>
  );
}

export function FloatingActionPill({
  children,
  className,
  onClick,
  type = "button",
  variant = "default",
  asChild,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  asChild?: boolean;
}) {
  return (
    <Button
      type={type}
      variant={variant}
      size="sm"
      className={cn(FLOATING_ACTION_PILL_CLASS, className)}
      onClick={onClick}
      asChild={asChild}
    >
      {children}
    </Button>
  );
}

export function FloatingCapsuleCluster({
  children,
  className,
  bodyClassName,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  glow?: boolean;
}) {
  return (
    <FloatingIslandCapsule
      className={cn("pointer-events-auto shrink-0", className)}
      bodyClassName={cn("gap-1.5 px-2", bodyClassName)}
      glow={glow}
    >
      {children}
    </FloatingIslandCapsule>
  );
}
