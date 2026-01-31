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

  const iconRail = (
    <div className="relative flex h-full w-12 shrink-0 flex-col items-center gap-1 bg-sidebar border-l border-sidebar-border/50 pt-3 pb-3">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-1">
        {sidebarSlots.map((slot) => {
          const Icon = slot.icon;
          const label = slot.label ?? slot.id;
          const isActive = activeActionId === slot.id;
          const handleClick = () => {
            actions.setActiveSidebarAction(isActive ? null : slot.id);
          };
          return (
            <Tooltip key={slot.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 border border-transparent transition-all duration-200",
                    isActive 
                      ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_15px_-5px_var(--primary)]" 
                      : "hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                  )}
                  onClick={handleClick}
                >
                  {Icon ? (
                    <Icon className={cn(
                      "h-4 w-4",
                      isActive && "drop-shadow-[0_0_6px_var(--primary)]"
                    )} />
                  ) : (
                    <span className="text-xs font-mono font-semibold">{label.slice(0, 1)}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-mono uppercase tracking-wider text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden bg-sidebar">
      {iconRail}
      
      <AnimatePresence mode="wait" initial={false}>
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative flex h-full flex-col overflow-hidden bg-background border-l border-sidebar-border/50"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-border/30 px-4 py-3">
              <div className="flex-1 min-w-0">
                {ActiveHeader ? (
                  <ActiveHeader />
                ) : (
                  <h3 className="font-display font-medium uppercase tracking-wider text-sm">{activeSlot?.label}</h3>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 ml-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-transparent"
                onClick={() => actions.setActiveSidebarAction(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
              {ActiveComponent ? <ActiveComponent /> : null}
            </div>

            {ActiveFooter ? (
              <div className="relative z-10 shrink-0 border-t border-border/30 bg-background/80 px-4 py-3">
                <ActiveFooter />
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
