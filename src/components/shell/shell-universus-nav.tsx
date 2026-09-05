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
import { MobileNavIconButton } from "./mobile-nav-bar/nav-icon-button";
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

type ShellUniversusNavMobileNavProps = {
  variant: "mobile-nav";
};

function ShellUniversusNavSidebarInner() {
  const dock = useUniversusMediaDockOptional();
  const { collapsed } = useLeftSidebarContext();
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
        <span className="chrome-label-case whitespace-nowrap text-xs">
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
          className="chrome-label-case text-xs"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return control;
}

function ShellUniversusNavMobileNavInner() {
  const { panelState, toggleLauncher } = useUniversusMediaDock();
  const isOpen = panelState === "open";

  return (
    <MobileNavIconButton
      label="UniVersus mini player"
      aria-pressed={isOpen}
      active={isOpen}
      onClick={() => toggleLauncher()}
    >
      <Tv
        className="size-5"
        aria-hidden
        strokeWidth={isOpen ? 0 : 2}
        fill={isOpen ? "currentColor" : "none"}
      />
    </MobileNavIconButton>
  );
}

export function ShellUniversusNav(
  props: ShellUniversusNavSidebarProps | ShellUniversusNavMobileNavProps
) {
  if (props.variant === "sidebar") {
    return <ShellUniversusNavSidebarInner />;
  }
  return <ShellUniversusNavMobileNavInner />;
}
