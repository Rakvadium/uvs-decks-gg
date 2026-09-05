"use client";

import { ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_INSET_ROW } from "./mobile-glass";
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

type ShellFeedbackNavProfileSheetProps = {
  variant: "profile-sheet";
  onAfterOpen?: () => void;
};

function ShellFeedbackNavSidebarInner() {
  const { collapsed } = useLeftSidebarContext();
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
  return control;
}

function ShellFeedbackNavProfileSheetInner({ onAfterOpen }: { onAfterOpen?: () => void }) {
  const { openFeedbackDialog } = useFeedbackDialogControl();
  return (
    <button
      type="button"
      onClick={() => {
        onAfterOpen?.();
        openFeedbackDialog();
      }}
      className={MOBILE_INSET_ROW}
    >
      <MessageSquare className="size-5 text-primary" aria-hidden />
      <span className="flex-1">Send feedback</span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </button>
  );
}

export function ShellFeedbackNav(
  props: ShellFeedbackNavSidebarProps | ShellFeedbackNavProfileSheetProps
) {
  if (props.variant === "sidebar") {
    return <ShellFeedbackNavSidebarInner />;
  }
  return <ShellFeedbackNavProfileSheetInner onAfterOpen={props.onAfterOpen} />;
}
