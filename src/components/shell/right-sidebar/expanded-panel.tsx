import * as m from "framer-motion/m";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/typography-headings";
import {
  SHELL_CHROME_EDGE_LEFT,
  SHELL_SIDEBAR_SURFACE_STYLE,
} from "../shell-chrome";
import { useRightSidebarContext } from "./context";

export function RightSidebarExpandedPanel() {
  const {
    activeSlot,
    ActiveComponent,
    ActiveFooter,
    ActiveHeader,
    isExpanded,
    isResizing,
    panelWidth,
    setActiveSidebarAction,
  } = useRightSidebarContext();
  const prefersReducedMotion = usePrefersReducedMotion();
  const show = Boolean(isExpanded && ActiveComponent);
  const disableMotion = prefersReducedMotion || isResizing;
  const openCloseTransition = disableMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <m.div
          key="right-expanded-panel"
          className={cn(
            "relative flex h-full flex-col overflow-hidden text-sidebar-foreground",
            SHELL_CHROME_EDGE_LEFT
          )}
          style={SHELL_SIDEBAR_SURFACE_STYLE}
          initial={disableMotion ? false : { width: 0 }}
          animate={{ width: panelWidth }}
          exit={disableMotion ? undefined : { width: 0 }}
          transition={openCloseTransition}
        >
          <div
            className="flex h-full min-h-0 w-full min-w-0 flex-col"
            style={{ width: panelWidth, minWidth: panelWidth }}
          >
            <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-sidebar-border px-4 py-3">
              <div className="min-w-0 flex-1">
                {ActiveHeader ? (
                  <ActiveHeader />
                ) : (
                  <SectionHeading className="font-display text-sm font-medium uppercase tracking-wider text-sidebar-foreground">
                    {activeSlot?.label}
                  </SectionHeading>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-8 w-8 shrink-0 border border-transparent text-sidebar-foreground hover:border-accent/35 hover:bg-accent/10 hover:text-accent"
                onClick={() => setActiveSidebarAction(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative z-10 min-h-0 flex-1 overflow-hidden bg-background/40">
              {ActiveComponent ? <ActiveComponent /> : null}
            </div>

            {ActiveFooter ? (
              <div className="relative z-10 shrink-0 border-t border-sidebar-border bg-sidebar/90 px-4 py-3">
                <ActiveFooter />
              </div>
            ) : null}
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
