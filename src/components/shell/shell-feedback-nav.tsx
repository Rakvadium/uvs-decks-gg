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
        "render-stable relative flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:border-sidebar-border/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        collapsed && "w-full justify-center px-2 py-2.5"
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      {!collapsed ? (
        <span className="whitespace-nowrap font-mono text-xs uppercase tracking-wider">
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
      className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
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
