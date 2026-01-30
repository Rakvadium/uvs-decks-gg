"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useShellSlot } from "./shell-slot-provider";

export function RightSidebar() {
  const { state, actions } = useShellSlot();
  const sidebarSlots = state.slots.get("right-sidebar") ?? [];
  const activeActionId = state.activeSidebarActionId;

  if (sidebarSlots.length === 0) return null;

  const activeSlot = sidebarSlots.find((slot) => slot.id === activeActionId);
  const ActiveComponent = activeSlot?.component;
  const ActiveHeader = activeSlot?.header;
  const ActiveFooter = activeSlot?.footer;
  const isExpanded = activeActionId && ActiveComponent;

  return (
    <div className="flex h-full bg-sidebar">
      <AnimatePresence mode="wait" initial={false}>
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative h-full overflow-hidden rounded-tr-xl rounded-br-xl border border-sidebar-border bg-background"
          >
            <div className="pointer-events-none absolute -top-3 right-0 z-10 h-3 w-3">
              <div className="h-full w-full rounded-bl-xl bg-sidebar" />
            </div>
            <div className="flex h-full w-80 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
                <div className="flex-1 min-w-0">
                  {ActiveHeader ? <ActiveHeader /> : <h3 className="font-medium">{activeSlot?.label}</h3>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 ml-2"
                  onClick={() => actions.setActiveSidebarAction(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                {ActiveComponent ? <ActiveComponent /> : null}
              </div>

              {ActiveFooter ? (
                <div className="shrink-0 border-t bg-background px-4 py-3">
                  <ActiveFooter />
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ width: 0 }}
            animate={{ width: 12 }}
            exit={{ width: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative h-full overflow-hidden rounded-tr-xl bg-background"
          >
            <div className="pointer-events-none absolute -top-3 right-0 z-10 h-3 w-3">
              <div className="h-full w-full rounded-bl-xl bg-sidebar" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full w-12 flex-col items-center gap-1 bg-sidebar pt-1 pb-3">
        {sidebarSlots.map((slot) => {
          const Icon = slot.icon;
          const label = slot.label ?? slot.id;
          return (
          <Tooltip key={slot.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  activeActionId === slot.id && "bg-sidebar-accent"
                )}
                onClick={() => actions.setActiveSidebarAction(
                  activeActionId === slot.id ? null : slot.id
                )}
              >
                {Icon ? <Icon className="h-4 w-4" /> : <span className="text-xs font-semibold">{label.slice(0, 1)}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
          </Tooltip>
        )})}
      </div>
    </div>
  );
}
