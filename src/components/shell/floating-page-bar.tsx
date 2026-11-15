"use client";

import Link from "next/link";
import { useRef, type ComponentType, type ReactNode, type Ref } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { IconToolbarButton } from "@/components/ui/icon-toolbar-button";
import { cn } from "@/lib/utils";
import { useSlashToFocus } from "@/hooks/use-slash-to-focus";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  FloatingIslandCapsule,
  floatingIslandHoverClassName,
  floatingIslandSurfaceClassName,
} from "./floating-island";

const FLOATING_CENTER_WIDTH_CLASS_NAMES = {
  default: "grid-cols-[minmax(max-content,1fr)_minmax(0,var(--floating-center-w))_minmax(max-content,1fr)]",
  wide: "grid-cols-[minmax(max-content,1fr)_minmax(0,var(--floating-center-w-wide))_minmax(max-content,1fr)]",
} as const;

export type FloatingCenterWidth = keyof typeof FLOATING_CENTER_WIDTH_CLASS_NAMES;

export function FloatingPageBar({
  left,
  center,
  right,
  centerWidth = "default",
  className,
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  centerWidth?: FloatingCenterWidth;
  className?: string;
}) {
  return (
    <div
      data-slot="floating-page-bar"
      data-center-width={centerWidth}
      className={cn(
        "pointer-events-none grid w-full min-w-0 items-center gap-3 py-0.5",
        FLOATING_CENTER_WIDTH_CLASS_NAMES[centerWidth],
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-start gap-2">{left}</div>
      <div className="flex min-w-0 justify-center">{center}</div>
      <div className="flex min-w-0 items-center justify-end gap-2">{right}</div>
    </div>
  );
}

export const PAGE_WASH_CLASS_NAMES = {
  fade: "bg-linear-to-b from-primary/7 via-primary/3 via-40% to-transparent",
  radial:
    "bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_32%),radial-gradient(circle_at_80%_8%,color-mix(in_oklab,var(--secondary)_10%,transparent),transparent_28%)]",
  grid:
    "bg-[radial-gradient(circle_at_30%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_22rem),radial-gradient(circle_at_100%_45%,color-mix(in_oklab,var(--secondary)_10%,transparent),transparent_24rem),linear-gradient(to_right,color-mix(in_oklab,var(--border)_22%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_22%,transparent)_1px,transparent_1px)] bg-size-[100%_100%,100%_100%,24px_24px,24px_24px]",
  glow:
    "bg-[radial-gradient(circle_at_30%_0%,color-mix(in_oklab,var(--primary)_4%,transparent),transparent_24rem),radial-gradient(circle_at_70%_100%,color-mix(in_oklab,var(--secondary)_4%,transparent),transparent_24rem)]",
} as const;

export type PageWash = keyof typeof PAGE_WASH_CLASS_NAMES;

export function FloatingPageLayout({
  bar,
  children,
  contentClassName,
  pageWash,
  scrollRef,
}: {
  bar: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  pageWash?: PageWash;
  scrollRef?: Ref<HTMLDivElement>;
}) {
  // Desktop-only chrome: on mobile the nav bar and its slots own these controls, and a mounted
  // copy here would open a second instance of every bar dialog.
  const isMobile = useIsMobile();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col md:h-full">
      {pageWash ? (
        <div
          aria-hidden
          data-slot="page-wash"
          data-wash={pageWash}
          className={cn("pointer-events-none absolute inset-0", PAGE_WASH_CLASS_NAMES[pageWash])}
        />
      ) : null}
      {isMobile ? null : (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden px-4 pt-3 md:block md:px-6">
          {bar}
        </div>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] p-4 md:p-6 md:pt-[4.75rem]",
          "max-md:pt-[calc(var(--mobile-nav-h,3.5rem)+0.75rem)] max-md:pb-[calc(var(--mobile-tab-h,5rem)+1rem)] max-md:[scroll-padding-top:var(--mobile-nav-h,3.5rem)]",
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
              "chrome-label-case flex h-(--control-h-sm) shrink-0 items-center gap-1.5 rounded-island px-3 text-[11px] font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-(--selected-bg) text-(--selected-fg)"
                : "text-muted-foreground hover:bg-(--hover-bg) hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
            <span className={cn(hideLabel && "hidden lg:inline")}>{item.label}</span>
            {item.badge !== undefined && item.badge !== null && item.badge !== 0 ? (
              <span
                className={cn(
                  "rounded-island px-1.5 py-px text-[10px]",
                  isActive ? "bg-(--selected-bg)" : "bg-muted-elevated"
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
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  name: string;
  "aria-label": string;
  className?: string;
  children?: ReactNode;
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
        <IconToolbarButton shape="island" label="Clear search" onClick={() => onChange("")}>
          <X />
        </IconToolbarButton>
      ) : (
        <kbd className="hidden shrink-0 select-none items-center rounded-island border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground lg:flex">
          /
        </kbd>
      )}
      {children}
    </FloatingIslandCapsule>
  );
}

export function FloatingBackPill({
  href,
  onClick,
  label,
  className,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  const pillClass = cn(
    floatingIslandSurfaceClassName,
    floatingIslandHoverClassName,
    "pointer-events-auto flex size-(--control-h-md) shrink-0 items-center justify-center text-muted-foreground transition-[color,background-color,box-shadow] duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );

  return href ? (
    <Link href={href} aria-label={label} className={pillClass}>
      <ArrowLeft className="size-4" />
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={pillClass}>
      <ArrowLeft className="size-4" />
    </button>
  );
}

export function FloatingPageTitle({ children }: { children: ReactNode }) {
  return (
    <FloatingCapsuleCluster bodyClassName="px-4" glow>
      <h1 className="chrome-heading-case truncate text-sm font-semibold text-foreground">
        {children}
      </h1>
    </FloatingCapsuleCluster>
  );
}

export type FloatingActionPillVariant = "default" | "secondary" | "destructive" | "floating";

const floatingPillClassName = cn(
  floatingIslandSurfaceClassName,
  floatingIslandHoverClassName,
  "text-primary hover:text-primary hover:shadow-[var(--chrome-button-shadow-outline-hover)] [&_svg]:text-current"
);

export function FloatingActionPill({
  variant = "default",
  className,
  type = "button",
  ...props
}: Omit<ButtonProps, "variant" | "size" | "shape"> & {
  variant?: FloatingActionPillVariant;
  ref?: Ref<HTMLButtonElement>;
}) {
  const floating = variant === "floating";
  return (
    <Button
      type={type}
      variant={floating ? null : variant}
      size="md"
      shape="island"
      className={cn(
        "pointer-events-auto shrink-0 gap-1.5 px-4 text-xs has-[>svg]:px-2.5",
        floating ? floatingPillClassName : "shadow-[var(--chrome-floating-shadow)]",
        className
      )}
      {...props}
    />
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
