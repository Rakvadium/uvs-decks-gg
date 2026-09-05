"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AppBrandLink } from "@/components/brand/app-brand-link";
import { CommunityTierListsPageMobileNavAction } from "@/components/community/tier-lists/page-view/top-bar";
import { cn } from "@/lib/utils";
import { MOBILE_GLASS_BAR, MOBILE_GLASS_HAIRLINE_BOTTOM } from "../mobile-glass";
import { useMobileShell } from "../mobile-shell-context";
import { MOBILE_NAV_ROW_HEIGHT_CLASS } from "../mobile-tab-bar/metrics";
import { ShellUniversusNav } from "../shell-universus-nav";
import { SlotRenderer } from "../shell-slot-provider";
import { DeckDetailsMobileNav } from "./deck-details-nav";
import { MobileNavBackButton } from "./nav-icon-button";
import { MobileNavTitle } from "./nav-title";
import { resolveMobileNavPage, type MobileNavPageConfig } from "./page-config";

function PageAction({ pathname }: { pathname: string }) {
  if (/^\/community\/tier-lists\/?$/.test(pathname)) {
    return <CommunityTierListsPageMobileNavAction />;
  }
  return null;
}

function NavRow({ config, pathname }: { config: MobileNavPageConfig; pathname: string }) {
  if (config.kind === "deck-details") {
    return <DeckDetailsMobileNav />;
  }

  if (config.kind === "tier-list-detail") {
    return (
      <div className="col-span-3 flex min-w-0 items-center px-1">
        <div className="min-w-0 flex-1">
          <SlotRenderer area="top-bar" />
        </div>
      </div>
    );
  }

  const leading =
    config.kind === "brand" ? (
      <AppBrandLink className="gap-2 pl-1.5" markSize="sm" wordmarkLayout="inline" />
    ) : config.kind === "child" && config.backHref ? (
      <MobileNavBackButton href={config.backHref} label={config.backLabel ?? "Back"} />
    ) : (
      <AppBrandLink className="pl-1.5" markSize="sm" showWordmark={false} />
    );

  return (
    <>
      <div className="flex min-w-0 items-center justify-start">{leading}</div>
      <div className="flex min-w-0 items-center justify-center">
        {config.kind === "brand" ? (
          <span className="sr-only">{config.title}</span>
        ) : (
          <MobileNavTitle collapsible={config.kind === "section"}>{config.title}</MobileNavTitle>
        )}
      </div>
      <div className="flex min-w-0 items-center justify-end gap-0.5">
        <PageAction pathname={pathname} />
        {config.showMediaToggle ? <ShellUniversusNav variant="mobile-nav" /> : null}
      </div>
    </>
  );
}

export function MobileNavBar() {
  const rawPathname = usePathname();
  const pathname = rawPathname.split("?")[0] ?? "";
  const config = resolveMobileNavPage(pathname);
  const { setNavBarHeight } = useMobileShell();
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const element = headerRef.current;
    if (!element) return;

    const update = () => setNavBarHeight(element.getBoundingClientRect().height);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [setNavBarHeight]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "absolute inset-x-0 top-0 z-40 flex flex-col pt-[env(safe-area-inset-top)]",
        MOBILE_GLASS_BAR,
        MOBILE_GLASS_HAIRLINE_BOTTOM
      )}
    >
      <div
        className={cn(
          "grid grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center px-1.5",
          MOBILE_NAV_ROW_HEIGHT_CLASS
        )}
      >
        <NavRow config={config} pathname={pathname} />
      </div>
    </header>
  );
}
