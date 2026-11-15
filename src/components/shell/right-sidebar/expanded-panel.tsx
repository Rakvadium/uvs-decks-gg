import type { ReactNode } from "react";
import * as m from "framer-motion/m";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { IconToolbarButton } from "@/components/ui/icon-toolbar-button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/typography-headings";
import {
  SHELL_CHROME_EDGE_LEFT,
  SHELL_SIDEBAR_SURFACE_STYLE,
} from "../shell-chrome";
import { useRightSidebarContext } from "./context";

export function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      data-slot="panel-header"
      className="relative z-10 flex h-(--control-h-lg) shrink-0 items-center gap-2 border-b border-sidebar-border px-4"
    >
      <SectionHeading data-slot="panel-title" size="xs" className="min-w-0 flex-1 truncate text-sidebar-foreground">
        {title}
      </SectionHeading>
      <IconToolbarButton label="Close panel" className="shrink-0" onClick={onClose}>
        <X />
      </IconToolbarButton>
    </div>
  );
}

export function PanelFooter({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="panel-footer"
      className="relative z-10 flex shrink-0 items-center justify-end gap-2 border-t border-sidebar-border bg-sidebar px-4 py-3"
    >
      {children}
    </div>
  );
}

export function RightSidebarExpandedPanel() {
  const {
    activeSlot,
    ActiveComponent,
    ActiveFooter,
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
            <PanelHeader
              title={activeSlot?.label ?? activeSlot?.id ?? ""}
              onClose={() => setActiveSidebarAction(null)}
            />

            <div className="relative z-10 min-h-0 flex-1 overflow-hidden bg-background/40">
              {ActiveComponent ? <ActiveComponent /> : null}
            </div>

            {ActiveFooter ? (
              <PanelFooter>
                <ActiveFooter />
              </PanelFooter>
            ) : null}
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
