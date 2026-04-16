import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/typography-headings";
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
  const width = isExpanded ? panelWidth : 0;

  return (
    <motion.div
      initial={false}
      animate={{ width }}
      transition={isResizing ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "render-stable relative flex h-full flex-col overflow-hidden bg-background",
        width > 0 && "border-l border-sidebar-border/50"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {isExpanded ? (
        <>
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
        </>
      ) : null}
    </motion.div>
  );
}
