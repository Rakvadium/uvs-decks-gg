"use client";

import { RightSidebarProvider, useRightSidebarContext } from "./context";
import { RightSidebarExpandedPanel } from "./expanded-panel";
import { RightSidebarIconRail } from "./icon-rail";

function RightSidebarContent() {
  const { sidebarSlots } = useRightSidebarContext();

  if (sidebarSlots.length === 0) return null;

  return (
    <div className="relative z-10 flex h-full overflow-hidden text-sidebar-foreground">
      <RightSidebarIconRail />
      <RightSidebarExpandedPanel />
    </div>
  );
}

export function RightSidebar() {
  return (
    <RightSidebarProvider>
      <RightSidebarContent />
    </RightSidebarProvider>
  );
}
