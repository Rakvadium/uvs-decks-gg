import * as m from "framer-motion/m";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/typography-headings";
import { useRightSidebarContext } from "./context";

export function RightSidebarExpandedPanel() {
  const {
    activeActionId,
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
  const openTransition =
    prefersReducedMotion || isResizing
      ? { duration: 0 }
      : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <div
      className={cn(
        "render-stable relative flex h-full flex-col overflow-hidden bg-background",
        isExpanded && panelWidth > 0 && "border-l border-sidebar-border/50"
      )}
      style={{ width: isExpanded ? panelWidth : 0, overflow: "hidden" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {isExpanded ? (
        <m.div
          key={activeActionId ?? "panel"}
          className="flex h-full min-h-0 w-full min-w-0 flex-col"
          style={{ minWidth: panelWidth }}
          initial={prefersReducedMotion ? { x: 0 } : { x: "100%" }}
          animate={{ x: 0 }}
          transition={openTransition}
        >
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-border/30 px-4 py-3">
            <div className="min-w-0 flex-1">
              {ActiveHeader ? (
                <ActiveHeader />
              ) : (
                <SectionHeading className="font-display text-sm font-medium uppercase tracking-wider">{activeSlot?.label}</SectionHeading>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 h-8 w-8 shrink-0 border border-transparent hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              onClick={() => setActiveSidebarAction(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-hidden">{ActiveComponent ? <ActiveComponent /> : null}</div>

          {ActiveFooter ? (
            <div className="relative z-10 shrink-0 border-t border-border/30 bg-background/80 px-4 py-3">
              <ActiveFooter />
            </div>
          ) : null}
        </m.div>
      ) : null}
    </div>
  );
}
