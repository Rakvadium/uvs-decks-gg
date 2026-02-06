"use client";

import { RightSidebarProvider, useRightSidebarContext } from "./context";
import { RightSidebarExpandedPanel } from "./expanded-panel";
import { RightSidebarIconRail } from "./icon-rail";

function RightSidebarContent() {
  const { sidebarSlots } = useRightSidebarContext();

  if (sidebarSlots.length === 0) return null;

  return (
    <div className="flex h-full overflow-hidden bg-sidebar">
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
