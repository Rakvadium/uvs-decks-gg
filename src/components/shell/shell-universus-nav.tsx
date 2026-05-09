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
        "render-stable relative flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed && "w-full justify-center px-2 py-2.5",
        isOpen
          ? "border-secondary/40 bg-secondary/15 text-primary shadow-[var(--chrome-shell-nav-active-shadow)]"
          : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-border/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <Tv
        className={cn(
          "h-4 w-4 shrink-0 transition-all duration-200",
          isOpen && "text-primary [filter:var(--chrome-shell-icon-drop-shadow)]"
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
        <div className="pointer-events-none absolute inset-0 rounded-md border border-secondary/30" />
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
      className="render-stable"
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
          ? "border-primary/50 bg-primary/25 text-primary"
          : "border-sidebar-border/60 bg-sidebar-accent/20 text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
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
