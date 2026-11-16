"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import Link from "next/link";
import { Check, Grid2x2Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileActionsSheetContext } from "../mobile-actions-sheet/context";
import { DockItem, SlotIconGlyph, slotLabel } from "./dock-items";
import { GlassRing, LIQUID_GLASS } from "./liquid-glass";
import { useRouteMenuActions, type MobileMenuAction } from "./menu-actions";
import { cornerRadius, morphTransition, useChromeKey, usePresence } from "./morph";
import { filterPanelSlots, type MobileLayoutRoute } from "./routes";
import { kickerVariants, sectionHeadingVariants } from "@/components/ui/typography-headings";

export type ActionStage = "closed" | "menu" | "panel";

const MENU_WIDTH = 256;
const MENU_GAP = 8;

/** iOS reads taps on these as long presses unless selection and the callout are off. */
export const TAP_TARGET = "touch-manipulation select-none [-webkit-touch-callout:none]";

/** Open/close state for the action button: its menu, and the panel a menu pick morphs into. */
export function useActionMenu(route: MobileLayoutRoute) {
  const sheet = useMobileActionsSheetContext();
  const actions = useRouteMenuActions(route.id);
  const [menuOpen, setMenuOpen] = useState(false);
  // What the open panel grows out of and collapses back into: an action-bar item, or null for the
  // action button (and its menu).
  const [origin, setOrigin] = useState<HTMLElement | null>(null);
  // Set by ActionSurface. Snaps the closed clip onto the anchor about to open, because a clip
  // transition starts from the current clip, which still sits on the previous anchor.
  const primeRef = useRef<((anchor: HTMLElement | null) => void) | null>(null);
  const slots = filterPanelSlots(sheet.sidebarSlots, route.panelSlots);
  const hasMenu = slots.length > 0 || actions.length > 0;
  const panelOpen = sheet.isActionsSheetOpen && sheet.sidebarSlots.length > 0;
  const stage: ActionStage = panelOpen ? "panel" : menuOpen && hasMenu ? "menu" : "closed";
  const { openSheet, closeSheet } = sheet;

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    closeSheet();
  }, [closeSheet]);

  const openPanel = useCallback(
    (slotId: string, from: HTMLElement | null = null) => {
      if (from) primeRef.current?.(from);
      setOrigin(from);
      openSheet(slotId);
      setMenuOpen(false);
    },
    [openSheet]
  );

  useEffect(() => {
    if (stage === "closed") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, closeAll]);

  return {
    sheet,
    layoutKey: route.id,
    slots,
    actions,
    hasMenu,
    stage,
    origin,
    primeRef,
    toggleMenu: () => {
      if (stage === "closed") primeRef.current?.(null);
      setOrigin(null);
      setMenuOpen(stage !== "menu");
    },
    closeMenu: () => setMenuOpen(false),
    closeAll,
    openPanel,
  };
}

export type ActionMenuState = ReturnType<typeof useActionMenu>;

/** The action button's glyph: a grid with a plus, or a close mark while the menu is open. */
export function ActionTriggerIcon({ open, className }: { open: boolean; className?: string }) {
  return open ? (
    <X className={cn("size-5", className)} strokeWidth={2.25} />
  ) : (
    <Grid2x2Plus className={cn("size-5", className)} strokeWidth={2.1} />
  );
}

interface Geometry {
  width: number;
  height: number;
  closed: string;
  menuRight: number;
  menuBottom: number;
  menuWidth: number;
}

function inset(top: number, right: number, bottom: number, left: number, radius: number) {
  const px = (value: number) => `${Math.round(Math.max(0, value))}px`;
  return `inset(${px(top)} ${px(right)} ${px(bottom)} ${px(left)} round ${px(radius)})`;
}

/** The closed clip: the surface shrunk onto `source` (an action-bar item) or else the trigger. */
function closedClipFor(surface: DOMRect, trigger: HTMLElement, source: HTMLElement | null) {
  const anchor = source ?? trigger;
  const from = anchor.getBoundingClientRect();
  const radius = cornerRadius(anchor);
  return inset(from.top - surface.top, surface.right - from.right, surface.bottom - from.bottom, from.left - surface.left, radius);
}

/** Clip and menu placement, measured from the real trigger and dock so any layout can host it. */
function useSurfaceGeometry(
  surfaceRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  dockRef: RefObject<HTMLElement | null>,
  /** Changes when the trigger mounts or moves (route, menu availability), so it is re-observed. */
  layoutKey: string,
  /** An action-bar item the panel grows out of instead of the trigger. */
  origin: HTMLElement | null
) {
  const chromeKey = useChromeKey();
  const [geometry, setGeometry] = useState<Geometry>({ width: 0, height: 0, closed: "inset(100% 0px 0px 100%)", menuRight: 0, menuBottom: 0, menuWidth: MENU_WIDTH });

  useLayoutEffect(() => {
    const measure = () => {
      const surface = surfaceRef.current?.getBoundingClientRect();
      const trigger = triggerRef.current?.getBoundingClientRect();
      const dock = dockRef.current?.getBoundingClientRect();
      if (!surface || !trigger || !dock) return;
      const right = surface.right - trigger.right;
      const menuWidth = Math.min(MENU_WIDTH, surface.width - right);
      setGeometry({
        width: surface.width,
        height: surface.height,
        closed: closedClipFor(surface, triggerRef.current!, origin?.isConnected ? origin : null),
        menuRight: Math.max(0, right),
        menuBottom: surface.bottom - dock.top + MENU_GAP,
        menuWidth,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const element of [surfaceRef.current, triggerRef.current, dockRef.current, origin]) {
      if (element) observer.observe(element);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [surfaceRef, triggerRef, dockRef, layoutKey, origin, chromeKey]);

  return geometry;
}

const MENU_ROW = cn(
  "group flex min-h-12 w-full items-center gap-3 rounded-surface px-2 text-left text-base font-medium text-foreground transition-colors duration-150 hover:bg-muted-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  TAP_TARGET
);
const ICON_TILE = "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted-tint text-foreground";

function MenuGroupLabel({ children }: { children: string }) {
  return <div className={cn(kickerVariants({ size: "sm" }), "block px-3 pb-1 pt-2")}>{children}</div>;
}

function MenuActionRow({ action, onDone }: { action: MobileMenuAction; onDone: () => void }) {
  const Icon = action.icon;
  const primary = action.tone === "primary";
  const body = (
    <>
      <span className={cn(ICON_TILE, primary && "bg-primary text-primary-foreground", action.selected && "bg-(--selected-bg) text-(--selected-fg)")}>
        <Icon className="size-[18px]" />
      </span>
      <span className={cn("min-w-0 flex-1 truncate", primary && "text-primary", action.selected && "text-(--selected-fg)")}>{action.label}</span>
      {action.selected ? <Check className="mr-1 size-4 shrink-0 text-(--selected-fg)" aria-hidden /> : null}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} role="menuitem" onClick={onDone} className={MENU_ROW}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role={action.selected === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={action.selected}
      disabled={action.disabled}
      onClick={() => {
        onDone();
        action.onSelect?.();
      }}
      className={MENU_ROW}
    >
      {body}
    </button>
  );
}

function groupActions(actions: MobileMenuAction[]) {
  const groups: Array<{ label?: string; items: MobileMenuAction[] }> = [];
  for (const action of actions) {
    const last = groups[groups.length - 1];
    if (last && last.label === action.group) last.items.push(action);
    else groups.push({ label: action.group, items: [action] });
  }
  return groups;
}

interface ActionSurfaceProps {
  menu: ActionMenuState;
  triggerRef: RefObject<HTMLElement | null>;
  dockRef: RefObject<HTMLElement | null>;
}

/**
 * The action button's morphing surface. It is laid out at full panel size (equal margins top and
 * bottom) and revealed with an animated clip: first as the menu growing out of the trigger, then
 * as the full panel when a panel is picked. Keep `filter` off its ancestors (iOS stops painting).
 */
export function ActionSurface({ menu, triggerRef, dockRef }: ActionSurfaceProps) {
  const { stage, slots, actions, sheet } = menu;
  const { activeSlot, ActiveComponent, ActiveFooter, selectSlot, closeSheet } = sheet;
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef<HTMLDivElement | null>(null);
  const { primeRef } = menu;

  useLayoutEffect(() => {
    primeRef.current = (anchor) => {
      const element = clipRef.current;
      const surface = surfaceRef.current?.getBoundingClientRect();
      const trigger = triggerRef.current;
      if (!element || !surface || !trigger) return;
      const clip = closedClipFor(surface, trigger, anchor);
      element.style.transition = "none";
      element.style.clipPath = clip;
      element.style.setProperty("-webkit-clip-path", clip);
      // Commit the jump before React applies the open clip, so the morph starts from the anchor.
      void element.getBoundingClientRect();
    };
    return () => {
      primeRef.current = null;
    };
  }, [primeRef, triggerRef]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuRadius, setMenuRadius] = useState(24);
  const chromeKey = useChromeKey();
  const geometry = useSurfaceGeometry(surfaceRef, triggerRef, dockRef, `${menu.layoutKey}:${menu.hasMenu}`, menu.origin);
  const panelPresent = usePresence(stage === "panel");
  // Active Deck's footer is one "Open Deck Details" button; the menu already offers that.
  const showSlotFooter = Boolean(ActiveFooter) && activeSlot?.id !== "active-deck";
  const groups = groupActions(actions);

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!element) return;
    const update = () => {
      setMenuHeight(element.offsetHeight);
      setMenuRadius(cornerRadius(element, 24));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [chromeKey]);

  // Menu and panel corners follow the rounded-xl step (from the chrome radius), read from the rendered menu.
  const surfaceRadius = menuRadius;
  const clip =
    stage === "panel"
      ? inset(0, 0, 0, 0, surfaceRadius)
      : stage === "menu"
        ? inset(
            geometry.height - geometry.menuBottom - menuHeight,
            geometry.menuRight,
            geometry.menuBottom,
            geometry.width - geometry.menuRight - geometry.menuWidth,
            surfaceRadius
          )
        : geometry.closed;

  const surfaceStyle: CSSProperties = {
    clipPath: clip,
    WebkitClipPath: clip,
    opacity: stage === "closed" ? 0 : 1,
    transition: morphTransition(stage !== "closed"),
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        tabIndex={stage === "closed" ? -1 : 0}
        onClick={menu.closeAll}
        className={cn(
          // Above the tools pill, so a tap anywhere outside closes the menu first. Only a panel
          // dims and blurs what's behind it; a menu leaves the page as it is.
          "absolute inset-0 z-modal transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          stage === "panel" && "bg-background-soft backdrop-blur-sm",
          stage === "closed" ? "duration-200" : "duration-300",
          stage === "closed" ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      />

      {/* Always mounted (clipped to the trigger when closed) so opening grows out of the trigger. */}
      <div
        ref={surfaceRef}
        aria-hidden={stage === "closed" || undefined}
        className="pointer-events-none absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] top-[max(0.75rem,env(safe-area-inset-top))] z-modal"
      >
        <div
          ref={clipRef}
          role={stage === "panel" ? "dialog" : undefined}
          aria-label={stage === "panel" ? (activeSlot?.label ?? "Panel") : undefined}
          className={cn(
            "absolute inset-0 select-none text-foreground [-webkit-touch-callout:none]",
            LIQUID_GLASS,
            stage !== "closed" && "pointer-events-auto"
          )}
          style={surfaceStyle}
        >
          <div
            ref={menuRef}
            role="menu"
            aria-label="Page actions"
            className={cn(
              "absolute flex flex-col gap-0.5 rounded-xl p-2",
              "bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_9%,transparent),transparent_55%)]",
              stage !== "menu" && "pointer-events-none"
            )}
            style={{
              right: geometry.menuRight,
              bottom: geometry.menuBottom,
              width: geometry.menuWidth,
              opacity: stage === "menu" ? 1 : 0,
              transition: `opacity ${stage === "menu" ? "200ms ease-out 60ms" : "120ms ease-in"}`,
            }}
          >
            <GlassRing />
            {slots.map((slot) => (
              <button key={slot.id} type="button" role="menuitem" onClick={() => menu.openPanel(slot.id)} className={MENU_ROW}>
                <span className={cn(ICON_TILE, "text-muted-foreground")}>
                  <SlotIconGlyph slot={slot} className={slot.iconFit === "media" ? "size-full rounded-none border-0" : "size-[18px]"} />
                </span>
                <span className="min-w-0 flex-1 truncate">{slotLabel(slot)}</span>
              </button>
            ))}
            {groups.map((group, index) => (
              <div key={group.label ?? `group-${index}`} className="flex flex-col gap-0.5">
                {slots.length > 0 || index > 0 ? <span aria-hidden className="mx-3 my-1 h-px bg-border/50" /> : null}
                {group.label ? <MenuGroupLabel>{group.label}</MenuGroupLabel> : null}
                {group.items.map((action) => (
                  <MenuActionRow key={action.id} action={action} onDone={menu.closeMenu} />
                ))}
              </div>
            ))}
          </div>

          {panelPresent ? (
            <div
              className={cn(
                "absolute inset-0 flex flex-col rounded-xl p-1.5",
                stage !== "panel" && "pointer-events-none"
              )}
              style={{
                opacity: stage === "panel" ? 1 : 0,
                transition: `opacity ${stage === "panel" ? "220ms ease-out 140ms" : "120ms ease-in"}`,
              }}
            >
              <GlassRing />
              <div className="flex h-12 shrink-0 items-center gap-2 pl-3 pr-1">
                <div className="min-w-0 flex-1">
                  <h2 className={cn(sectionHeadingVariants({ size: "sm" }), "truncate text-foreground")}>
                      {activeSlot ? (activeSlot.label ?? activeSlot.id) : "Panel"}
                    </h2>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="Close panel"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-island bg-muted-elevated text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    TAP_TARGET
                  )}
                >
                  <X className="size-5" strokeWidth={2.25} />
                </button>
              </div>
              <div key={activeSlot?.id} className="min-h-0 flex-1 select-text overflow-y-auto overscroll-contain rounded-surface">
                {ActiveComponent ? <ActiveComponent /> : null}
              </div>
              {showSlotFooter && ActiveFooter ? (
                <div className="flex shrink-0 items-center justify-end gap-2 px-1 pt-1.5">
                  <ActiveFooter />
                </div>
              ) : null}
              <nav aria-label="Panels" className="flex h-14 shrink-0 items-stretch justify-around gap-0.5 pt-1">
                {slots.map((slot) => (
                  <DockItem
                    key={slot.id}
                    label={slotLabel(slot)}
                    active={slot.id === activeSlot?.id}
                    onClick={() => selectSlot(slot.id)}
                    icon={<SlotIconGlyph slot={slot} />}
                  />
                ))}
              </nav>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

