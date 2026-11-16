"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Calendar, ChevronUp, Layers, Megaphone, MessageSquare, PlaySquare, Users } from "lucide-react";
import { DECK_VISIBILITY_MOBILE_TAB_LABELS, TABS } from "@/components/decks/decks-view/constants";
import { useDecksOptional } from "@/providers/DecksProvider";
import { communityDestinationFromLocation } from "@/components/community/community-destinations";
import { useLocationSearchParams } from "@/hooks/useLocationSearchParams";
import { cn } from "@/lib/utils";
import type { SlotRegistration } from "../shell-slot-provider";
import { TAP_TARGET, type ActionMenuState } from "./action-surface";
import { SlotIconGlyph, slotLabel } from "./dock-items";
import { SlidingIndicator, useSlidingIndicator } from "./sliding-indicator";
import type { MobileLayoutRoute } from "./routes";

interface BarSegment {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: number;
  href?: string;
  /** Receives the tapped element so a panel can grow out of it. */
  onSelect?: (element: HTMLElement) => void;
}

const SEGMENT = cn(
  "flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]",
  TAP_TARGET
);
const SEGMENT_ACTIVE = "text-foreground";

/** Over three choices, labels stack under icons so five still fit a phone width. */
const SEGMENT_STACKED = "h-12 flex-col gap-0.5 px-1 text-[10px]";

/** A row of equal-width choices inside the action bar: page sections, or panels to open. */
function BarSegments({ items, label }: { items: BarSegment[]; label: string }) {
  const stacked = items.length > 3;
  const activeId = items.find((item) => item.active)?.id ?? null;
  const { containerRef, indicatorRef } = useSlidingIndicator(activeId);

  return (
    <nav aria-label={label}>
      <div ref={containerRef} className="relative flex gap-1 rounded-2xl bg-muted-tint p-1">
        <SlidingIndicator indicatorRef={indicatorRef} className="rounded-xl bg-background shadow-[var(--chrome-floating-shadow)]" />
        {items.map((item) => {
          const body = (
            <>
              <span className="flex size-4 shrink-0 items-center justify-center">{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
              {item.badge !== undefined && !stacked ? (
                <span className="rounded-pill bg-muted-soft px-1.5 text-[10px] tabular-nums text-muted-foreground">{item.badge}</span>
              ) : null}
            </>
          );
          const className = cn(SEGMENT, "relative z-10", stacked && SEGMENT_STACKED, item.active && SEGMENT_ACTIVE);
          const marker = item.active ? { "data-indicator-active": "true" } : {};
          return item.href ? (
            <Link key={item.id} href={item.href} aria-current={item.active ? "page" : undefined} className={className} {...marker}>
              {body}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.active}
              onClick={(event) => item.onSelect?.(event.currentTarget)}
              className={className}
              {...marker}
            >
              {body}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function PeekRow({ slot, onOpen }: { slot: SlotRegistration; onOpen: (element: HTMLElement) => void }) {
  const Icon = slot.icon;
  const isMedia = slot.iconFit === "media";
  const subtitle = slot.tabLabel && slot.tabLabel !== slot.label ? slot.tabLabel : "Tap to open";

  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      aria-haspopup="dialog"
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-2xl bg-muted-tint p-1 pr-2 text-left transition-colors duration-150 hover:bg-muted-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        TAP_TARGET
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl",
          isMedia ? "border border-surface" : "bg-primary-selected text-primary"
        )}
      >
        {Icon ? <Icon className={isMedia ? "size-full" : "size-5"} /> : null}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-semibold text-foreground">{slot.label ?? slot.id}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-muted-elevated text-foreground">
        <ChevronUp className="size-4" />
      </span>
    </button>
  );
}

const DECK_TOOL_SLOTS = ["deck-gallery", "deck-stats", "deck-simulator"];

function teamSegments(pathname: string): BarSegment[] {
  const match = /^\/teams\/([^/]+)(\/[^/]+)?/.exec(pathname);
  const teamId = match?.[1];
  if (!teamId || teamId === "decks" || teamId === "invite") {
    return [
      { id: "teams", label: "My Teams", icon: <Users className="size-4" />, href: "/teams", active: pathname === "/teams" },
      { id: "team-decks", label: "Team Decks", icon: <Layers className="size-4" />, href: "/teams/decks", active: pathname.startsWith("/teams/decks") },
    ];
  }
  const base = `/teams/${teamId}`;
  const section = match?.[2]?.slice(1) ?? "announcements";
  const sections: Array<[string, string, ReactNode]> = [
    ["announcements", "News", <Megaphone key="n" className="size-4" />],
    ["chat", "Chat", <MessageSquare key="c" className="size-4" />],
    ["calendar", "Calendar", <Calendar key="k" className="size-4" />],
    ["decks", "Decks", <Layers key="d" className="size-4" />],
    ["members", "Members", <Users key="m" className="size-4" />],
  ];
  return sections.map(([id, label, icon]) => ({ id, label, icon, href: `${base}/${id}`, active: section === id }));
}

/**
 * Pannu's action bar: the page's most-used view switches or panels, merged above the navigation.
 * Returns null on pages without one, so the dock is just the navigation row.
 */
export function PannuActionBar({ route, menu, pathname }: { route: MobileLayoutRoute; menu: ActionMenuState; pathname: string }) {
  const { params } = useLocationSearchParams();
  const decks = useDecksOptional();

  if (route.id === "gallery") {
    const slot = menu.slots[0];
    return slot ? <PeekRow slot={slot} onOpen={(element) => menu.openPanel(slot.id, element)} /> : null;
  }

  if (route.id === "decks") {
    if (!decks) return null;
    const { state, actions, catalog } = decks;
    return (
      <BarSegments
        label="Deck lists"
        items={TABS.filter((tab) => tab.id !== "my-decks" || catalog.isAuthenticated).map((tab) => {
          const Icon = tab.icon;
          return {
            id: tab.id,
            label: DECK_VISIBILITY_MOBILE_TAB_LABELS[tab.id],
            icon: <Icon className="size-4" />,
            badge: catalog.deckCounts[tab.id],
            active: state.activeTab === tab.id,
            onSelect: () => actions.setActiveTab(tab.id),
          };
        })}
      />
    );
  }

  if (route.id === "deck-details") {
    const slots = menu.slots.filter((slot) => DECK_TOOL_SLOTS.includes(slot.id));
    if (slots.length === 0) return null;
    return (
      <BarSegments
        label="Deck panels"
        items={slots.map((slot) => ({
          id: slot.id,
          label: slot.id === "deck-simulator" ? "Hand Sim" : slotLabel(slot),
          icon: <SlotIconGlyph slot={slot} className="size-4" />,
          onSelect: (element) => menu.openPanel(slot.id, element),
        }))}
      />
    );
  }

  if (route.id === "community") {
    const destination = communityDestinationFromLocation(pathname, params);
    return (
      <BarSegments
        label="Community sections"
        items={[
          { id: "content", label: "Content", icon: <PlaySquare className="size-4" />, href: "/community", active: destination === "hub" },
          {
            id: "rankings",
            label: "Rankings",
            icon: <BarChart3 className="size-4" />,
            href: "/community/tier-lists?tab=rankings",
            active: destination === "rankings",
          },
        ]}
      />
    );
  }

  if (route.id === "teams") {
    return <BarSegments label="Team sections" items={teamSegments(pathname)} />;
  }

  return null;
}
