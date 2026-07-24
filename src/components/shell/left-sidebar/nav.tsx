import Link from "next/link";
import { Home, Shield } from "lucide-react";
import * as m from "framer-motion/m";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Kicker } from "@/components/ui/typography-headings";
import {
  SHELL_NAV_ICON_ACTIVE,
  SHELL_NAV_ITEM_ACTIVE,
  SHELL_NAV_ITEM_BASE,
  SHELL_NAV_ITEM_IDLE,
  SHELL_RAIL_ITEM_COLLAPSED_CLASS,
  SHELL_RAIL_STACK_CLASS,
} from "../shell-chrome";
import { useLeftSidebarContext } from "./context";

export function LeftSidebarNav() {
  const { collapsed, isOnAdminPage, navItems, pathname, prefersReducedMotion } = useLeftSidebarContext();

  const adminBackLink = (
    <Link
      href="/"
      className={cn(
        "rounded-md text-xs font-mono uppercase tracking-wider text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed ? cn("flex items-center", SHELL_RAIL_ITEM_COLLAPSED_CLASS) : "px-3 py-2"
      )}
    >
      <span className={cn("inline-flex items-center gap-2", collapsed && "justify-center")}>
        <Home className="h-3.5 w-3.5 shrink-0" />
        {!collapsed ? "Back to App" : null}
      </span>
    </Link>
  );

  return (
    <nav className={cn(collapsed ? cn(SHELL_RAIL_STACK_CLASS, "flex-1") : "flex flex-1 flex-col gap-1 p-2")}>
      {!isOnAdminPage
        ? navItems.map((item, index) => {
            const href = `/${item.path}`;
            const isActive = pathname.includes(`/${item.path}`);
            const Icon = item.icon;

            const navLink = (
              <Link key={item.path} href={href} aria-label={collapsed ? item.label : undefined}>
                <m.div
                  initial={false}
                  whileHover={prefersReducedMotion ? undefined : { x: collapsed ? 0 : 4 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className={cn(
                    SHELL_NAV_ITEM_BASE,
                    collapsed && SHELL_RAIL_ITEM_COLLAPSED_CLASS,
                    isActive ? SHELL_NAV_ITEM_ACTIVE : SHELL_NAV_ITEM_IDLE
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-[color,filter] duration-200",
                      isActive && SHELL_NAV_ICON_ACTIVE
                    )}
                  />
                  {!collapsed ? (
                    <span className="whitespace-nowrap font-mono text-xs uppercase tracking-wider">
                      {item.label}
                    </span>
                  ) : null}
                  {isActive ? (
                    <div className="pointer-events-none absolute inset-0 rounded-md border border-accent/50" />
                  ) : null}
                </m.div>
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navLink;
          })
        : null}

      {isOnAdminPage ? (
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            collapsed ? SHELL_RAIL_ITEM_COLLAPSED_CLASS : "px-3 py-2.5"
          )}
        >
          <Shield className={cn("h-4 w-4 shrink-0", SHELL_NAV_ICON_ACTIVE)} />
          {!collapsed ? (
            <Kicker className="whitespace-nowrap font-display text-accent">
              Admin Panel
            </Kicker>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1" />

      {isOnAdminPage ? (
        collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{adminBackLink}</TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
              Back to App
            </TooltipContent>
          </Tooltip>
        ) : (
          adminBackLink
        )
      ) : null}
    </nav>
  );
}
