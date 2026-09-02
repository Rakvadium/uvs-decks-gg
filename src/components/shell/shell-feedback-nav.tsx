"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFeedbackDialogControl } from "./feedback-dialog-provider";
import { useLeftSidebarContext } from "./left-sidebar/context";
import {
  SHELL_NAV_ITEM_BASE,
  SHELL_NAV_ITEM_IDLE,
  SHELL_RAIL_ITEM_COLLAPSED_CLASS,
} from "./shell-chrome";

type ShellFeedbackNavSidebarProps = {
  variant: "sidebar";
};

type ShellFeedbackNavMobileHeaderProps = {
  variant: "mobile-header";
};

function ShellFeedbackNavSidebarInner() {
  const { collapsed, prefersReducedMotion } = useLeftSidebarContext();
  const { openFeedbackDialog } = useFeedbackDialogControl();
  const label = "Feedback";
  const control = (
    <button
      type="button"
      onClick={openFeedbackDialog}
      className={cn(
        SHELL_NAV_ITEM_BASE,
        SHELL_NAV_ITEM_IDLE,
        collapsed ? SHELL_RAIL_ITEM_COLLAPSED_CLASS : "w-full"
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      {!collapsed ? (
        <span className="chrome-label-case whitespace-nowrap text-xs">
          {label}
        </span>
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
  return (
    <div
      style={prefersReducedMotion ? undefined : { animationDelay: "200ms" }}
    >
      {control}
    </div>
  );
}

function ShellFeedbackNavMobileHeaderInner() {
  const { openFeedbackDialog } = useFeedbackDialogControl();
  return (
    <button
      type="button"
      onClick={openFeedbackDialog}
      aria-label="Feedback"
      className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground transition-colors hover:border-accent/35 hover:bg-accent/10 hover:text-accent"
    >
      <MessageSquare className="h-4 w-4" aria-hidden />
    </button>
  );
}

export function ShellFeedbackNav(
  props: ShellFeedbackNavSidebarProps | ShellFeedbackNavMobileHeaderProps
) {
  if (props.variant === "sidebar") {
    return <ShellFeedbackNavSidebarInner />;
  }
  return <ShellFeedbackNavMobileHeaderInner />;
}
