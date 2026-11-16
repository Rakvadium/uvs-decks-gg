"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_SAFE_BOTTOM } from "../mobile-glass";
import { useMobileShell } from "../mobile-shell-context";
import { MobileGlassCapsule } from "../mobile-tab-bar/glass-capsule";
import { ActionSurface, ActionTriggerIcon, TAP_TARGET, useActionMenu } from "./action-surface";
import { DockNavItems } from "./dock-items";
import { MORPH_EASE, MORPH_MS } from "./morph";
import { resolveMobileLayoutRoute } from "./routes";

/** Fades and settles the dock while the panel covers it. */
export function dockHiddenStyle(hidden: boolean) {
  return {
    opacity: hidden ? 0 : 1,
    transform: hidden ? "scale(0.96)" : "none",
    transition: `opacity 200ms ease ${hidden ? "0ms" : "180ms"}, transform ${MORPH_MS}ms ${MORPH_EASE}`,
  };
}

/** Reports the dock's height so page content can pad above it. */
export function useDockHeight(dockRef: RefObject<HTMLElement | null>) {
  const { setTabBarHeight } = useMobileShell();
  useLayoutEffect(() => {
    const element = dockRef.current;
    if (!element) return;
    const update = () => setTabBarHeight(element.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [dockRef, setTabBarHeight]);
}

/**
 * Menu layout: labeled tabs plus a round action button at the bottom right. The button grows into
 * a labeled menu; picking a panel morphs the menu, tabs and button into a tall panel.
 */
export function MobileMenuDock() {
  const pathname = usePathname().split("?")[0] ?? "";
  const route = resolveMobileLayoutRoute(pathname);
  const menu = useActionMenu(route);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hidden = menu.stage === "panel";
  useDockHeight(dockRef);

  return (
    <>
      <div
        ref={dockRef}
        className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-shell px-3 pt-3", MOBILE_SAFE_BOTTOM)}
        aria-hidden={hidden || undefined}
      >
        <div className="flex items-center gap-2" style={dockHiddenStyle(hidden)}>
          <nav aria-label="Primary" className={cn("min-w-0 flex-1", !hidden && "pointer-events-auto")}>
            <MobileGlassCapsule bodyClassName="h-14 items-stretch justify-around gap-0.5 p-1">
              <DockNavItems pathname={pathname} />
            </MobileGlassCapsule>
          </nav>
          {menu.hasMenu ? (
            <MobileGlassCapsule className={cn("shrink-0", !hidden && "pointer-events-auto")} bodyClassName="size-14">
              <button
                ref={triggerRef}
                type="button"
                onClick={menu.toggleMenu}
                aria-label="Page actions"
                aria-haspopup="menu"
                aria-expanded={menu.stage === "menu"}
                className={cn(
                  "flex size-full items-center justify-center rounded-pill text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95",
                  TAP_TARGET
                )}
              >
                <ActionTriggerIcon open={menu.stage === "menu"} />
              </button>
            </MobileGlassCapsule>
          ) : null}
        </div>
      </div>
      <ActionSurface menu={menu} triggerRef={triggerRef} dockRef={dockRef} />
    </>
  );
}
