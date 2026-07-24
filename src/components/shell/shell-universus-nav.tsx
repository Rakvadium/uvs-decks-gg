"use client";

import { Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useUniversusMediaDock,
  useUniversusMediaDockOptional,
} from "@/providers/UniversusMediaDockProvider";
import { useLeftSidebarContext } from "./left-sidebar/context";
import {
  SHELL_NAV_ICON_ACTIVE,
  SHELL_NAV_ITEM_ACTIVE,
  SHELL_NAV_ITEM_BASE,
  SHELL_NAV_ITEM_IDLE,
  SHELL_RAIL_ITEM_COLLAPSED_CLASS,
} from "./shell-chrome";

type ShellUniversusNavSidebarProps = {
  variant: "sidebar";
};

type ShellUniversusNavMobileHeaderProps = {
  variant: "mobile-header";
};

function ShellUniversusNavSidebarInner() {
  const dock = useUniversusMediaDockOptional();
  const { collapsed, prefersReducedMotion } = useLeftSidebarContext();
  if (!dock) return null;

  const { panelState, toggleLauncher } = dock;
  const isOpen = panelState === "open";
  const label = "UniVersus";

  const control = (
    <button
      type="button"
      onClick={() => toggleLauncher()}
      aria-pressed={isOpen}
      className={cn(
        SHELL_NAV_ITEM_BASE,
        collapsed ? SHELL_RAIL_ITEM_COLLAPSED_CLASS : "w-full",
        isOpen ? SHELL_NAV_ITEM_ACTIVE : SHELL_NAV_ITEM_IDLE
      )}
    >
      <Tv
        className={cn(
          "h-4 w-4 shrink-0 transition-colors duration-200",
          isOpen && SHELL_NAV_ICON_ACTIVE
        )}
        aria-hidden
        strokeWidth={isOpen ? 0 : 2}
        fill={isOpen ? "currentColor" : "none"}
      />
      {!collapsed ? (
        <span className="whitespace-nowrap font-mono text-xs uppercase tracking-wider">
          {label}
        </span>
      ) : null}
      {isOpen ? (
        <div className="pointer-events-none absolute inset-0 rounded-md border border-accent/50" />
      ) : null}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="font-mono text-xs uppercase tracking-wider"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      style={prefersReducedMotion ? undefined : { animationDelay: "220ms" }}
    >
      {control}
    </div>
  );
}

function ShellUniversusNavMobileHeaderInner() {
  const { panelState, toggleLauncher } = useUniversusMediaDock();
  const isOpen = panelState === "open";

  return (
    <button
      type="button"
      onClick={() => toggleLauncher()}
      aria-label="UniVersus mini player"
      aria-pressed={isOpen}
      className={cn(
        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
        isOpen
          ? "border-accent/55 bg-accent/20 text-accent"
          : "border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:border-accent/40 hover:bg-accent/12 hover:text-accent"
      )}
    >
      <Tv
        className="h-4 w-4"
        aria-hidden
        strokeWidth={isOpen ? 0 : 2}
        fill={isOpen ? "currentColor" : "none"}
      />
    </button>
  );
}

export function ShellUniversusNav(
  props: ShellUniversusNavSidebarProps | ShellUniversusNavMobileHeaderProps
) {
  if (props.variant === "sidebar") {
    return <ShellUniversusNavSidebarInner />;
  }
  return <ShellUniversusNavMobileHeaderInner />;
}
