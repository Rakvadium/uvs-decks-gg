"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_SAFE_BOTTOM } from "../mobile-glass";
import { MobileGlassCapsule } from "../mobile-tab-bar/glass-capsule";
import { LIQUID_GLASS } from "./liquid-glass";
import { PannuActionBar } from "./action-bar";
import { ActionSurface, ActionTriggerIcon, useActionMenu } from "./action-surface";
import { DOCK_ITEM_ACTIVE_CLASS, DOCK_ITEM_CLASS, DockNavItems } from "./dock-items";
import { dockHiddenStyle, useDockHeight } from "./menu-dock";
import { resolveMobileLayoutRoute } from "./routes";

/**
 * Pannu layout: one glass dock holding the page's action bar above the navigation, with the action
 * button as the last navigation item. The button opens the same menu and panels as Menu.
 */
export function MobilePannuDock() {
  const pathname = usePathname().split("?")[0] ?? "";
  const route = resolveMobileLayoutRoute(pathname);
  const menu = useActionMenu(route);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hidden = menu.stage === "panel";
  const menuOpen = menu.stage === "menu";
  useDockHeight(dockRef);

  return (
    <>
      <div
        ref={dockRef}
        className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-shell px-3 pt-3", MOBILE_SAFE_BOTTOM)}
        aria-hidden={hidden || undefined}
      >
        <div style={dockHiddenStyle(hidden)}>
          <MobileGlassCapsule
            className={cn("rounded-xl", !hidden && "pointer-events-auto")}
            bodyClassName={cn("flex-col items-stretch gap-1.5 rounded-xl p-1.5", LIQUID_GLASS)}
          >
            <div className="empty:hidden">
              <PannuActionBar route={route} menu={menu} pathname={pathname} />
            </div>
            <nav aria-label="Primary">
              <DockNavItems
                pathname={pathname}
                trailing={
                  menu.hasMenu ? (
                    <button
                      ref={triggerRef}
                      type="button"
                      onClick={menu.toggleMenu}
                      aria-label="Page actions"
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      className={cn(DOCK_ITEM_CLASS, "relative z-10", menuOpen && DOCK_ITEM_ACTIVE_CLASS)}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center">
                        <ActionTriggerIcon open={menuOpen} />
                      </span>
                      <span className="w-full truncate text-center text-[10px] font-medium leading-none">
                        {menuOpen ? "Close" : "Actions"}
                      </span>
                    </button>
                  ) : null
                }
              />
            </nav>
          </MobileGlassCapsule>
        </div>
      </div>
      <ActionSurface menu={menu} triggerRef={triggerRef} dockRef={dockRef} />
    </>
  );
}
