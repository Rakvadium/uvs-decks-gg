"use client";

import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/panel";
import { ActiveDeckSectionProvider, useActiveDeckSectionContext } from "./context";
import { ActiveDeckSectionGroups } from "./group-list";
import { ActiveDeckSectionHeader } from "./header";
import type { ActiveDeckSectionProps } from "./types";

function ActiveDeckSectionContent() {
  const { canDrop, droppableProps, isOver } = useActiveDeckSectionContext();

  return (
    <Panel
      className={cn(
        "space-y-2 p-3 transition-colors",
        canDrop && "border-(--selected-border) bg-(--hover-bg)",
        isOver && "bg-(--selected-bg)"
      )}
      {...droppableProps}
    >
      <ActiveDeckSectionHeader />
      <ActiveDeckSectionGroups />
    </Panel>
  );
}

export function ActiveDeckSection(props: ActiveDeckSectionProps) {
  return (
    <ActiveDeckSectionProvider {...props}>
      <ActiveDeckSectionContent />
    </ActiveDeckSectionProvider>
  );
}
