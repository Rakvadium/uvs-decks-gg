"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutGrid, Layers, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlidingIndicator, useSlidingIndicator } from "./sliding-indicator";
import type { SlotRegistration } from "../shell-slot-provider";

const NAV_ITEMS: Array<{ path: string; label: string; icon: LucideIcon }> = [
  { path: "gallery", label: "Gallery", icon: LayoutGrid },
  { path: "decks", label: "Decks", icon: Layers },
  { path: "community", label: "Community", icon: Users },
];

export const DOCK_ITEM_CLASS =
  "group flex h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-island px-1 text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 motion-safe:transition-[color,background-color,transform] touch-manipulation select-none [-webkit-touch-callout:none]";

export const DOCK_ITEM_ACTIVE_CLASS = "bg-(--selected-bg) text-(--selected-fg)";

function DockItemBody({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <>
      <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="w-full truncate text-center text-[10px] font-medium leading-none">{label}</span>
    </>
  );
}

interface DockItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  /** Active, but the highlight is a shared sliding pill (`useSlidingIndicator`), not this item's own background. */
  indicator?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/** One labeled item in a dock row. Navigation tabs and panel actions share this look. */
export function DockItem({ icon, label, active = false, indicator = false, href, onClick, className }: DockItemProps) {
  const classes = cn(DOCK_ITEM_CLASS, "relative z-10", active && (indicator ? "text-(--selected-fg)" : DOCK_ITEM_ACTIVE_CLASS), className);
  const marker = indicator && active ? { "data-indicator-active": "true" } : {};

  if (href) {
    return (
      <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={classes} {...marker}>
        <DockItemBody icon={icon} label={label} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={classes} {...marker}>
      <DockItemBody icon={icon} label={label} />
    </button>
  );
}

/**
 * The three section tabs, plus an optional `trailing` item (Pannu's Actions) in the same row, so
 * all items are direct flex siblings with equal widths. The active highlight slides between tabs.
 */
export function DockNavItems({ pathname, className, trailing }: { pathname: string; className?: string; trailing?: ReactNode }) {
  const activePath = NAV_ITEMS.find((item) => pathname === `/${item.path}` || pathname.startsWith(`/${item.path}/`))?.path ?? null;
  const { containerRef, indicatorRef } = useSlidingIndicator(activePath);

  return (
    <div ref={containerRef} className={cn("relative flex w-full min-w-0 items-stretch gap-0.5", className)}>
      <SlidingIndicator indicatorRef={indicatorRef} className="rounded-island bg-(--selected-bg)" />
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.path === activePath;
        return (
          <DockItem
            key={item.path}
            href={`/${item.path}`}
            label={item.label}
            active={active}
            indicator
            icon={<Icon className="size-5" strokeWidth={active ? 2.25 : 2} />}
          />
        );
      })}
      {trailing}
    </div>
  );
}

/** A slot's icon at dock size; media icons (active deck art) render as a small disc. */
export function SlotIconGlyph({ slot, className }: { slot: SlotRegistration; className?: string }) {
  const Icon = slot.icon;
  const label = slot.tabLabel ?? slot.label ?? slot.id;
  if (!Icon) return <span className="text-xs font-semibold">{label.slice(0, 1)}</span>;
  if (slot.iconFit === "media") {
    return (
      <span className={cn("block size-6 overflow-hidden rounded-full border border-surface", className)}>
        <Icon className="size-full" />
      </span>
    );
  }
  return <Icon className={cn("size-5", className)} />;
}

export function slotLabel(slot: SlotRegistration) {
  return slot.tabLabel ?? slot.label ?? slot.id;
}
