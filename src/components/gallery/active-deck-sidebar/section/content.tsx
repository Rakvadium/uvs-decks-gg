"use client";

import { cn } from "@/lib/utils";
import { ActiveDeckSectionProvider, useActiveDeckSectionContext } from "./context";
import { ActiveDeckSectionGroups } from "./group-list";
import { ActiveDeckSectionHeader } from "./header";
import type { ActiveDeckSectionProps } from "./types";

function ActiveDeckSectionContent() {
  const { canDrop, droppableProps, isOver } = useActiveDeckSectionContext();

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-border/50 bg-card/40 p-3 transition-colors",
        canDrop && "border-primary/40 bg-primary/5",
        isOver && "bg-primary/10"
      )}
      {...droppableProps}
    >
      <ActiveDeckSectionHeader />
      <ActiveDeckSectionGroups />
    </div>
  );
}

export function ActiveDeckSection(props: ActiveDeckSectionProps) {
  return (
    <ActiveDeckSectionProvider {...props}>
      <ActiveDeckSectionContent />
    </ActiveDeckSectionProvider>
  );
}
