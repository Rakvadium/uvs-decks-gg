"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarAction } from "@/app/(app)/layout";

interface RightSidebarProps {
  actions?: SidebarAction[];
}

export function RightSidebar({ actions = [] }: RightSidebarProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const activeActionData = actions.find((a) => a.id === activeAction);
  const activeContent = activeActionData?.content;
  const activeFooter = activeActionData?.footer;

  if (actions.length === 0) {
    return null;
  }

  const isExpanded = activeAction && activeContent;

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
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
                <div className="flex-1 min-w-0">
                  {activeActionData?.header ?? (
                    <h3 className="font-medium">{activeActionData?.label}</h3>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 ml-2"
                  onClick={() => setActiveAction(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content Area - let content manage its own scrolling */}
              <div className="min-h-0 flex-1 overflow-hidden">
                {activeContent}
              </div>

              {/* Fixed Footer (if provided) */}
              {activeFooter ? (
                <div className="shrink-0 border-t bg-background px-4 py-3">
                  {activeFooter}
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
        {actions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  activeAction === action.id && "bg-sidebar-accent"
                )}
                onClick={() =>
                  setActiveAction(activeAction === action.id ? null : action.id)
                }
              >
                {action.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{action.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
