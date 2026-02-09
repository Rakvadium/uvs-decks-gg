"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { DecksSidebarProvider } from "./context";
import { DeckCreateDialog } from "./create-dialog";
import { DecksSidebarHeader, DecksSidebarMobileBottomBar } from "./header";
import { DecksSidebarList } from "./list";

export function DecksSidebar() {
  const isMobile = useIsMobile();

  return (
    <DecksSidebarProvider>
      <div className="flex h-full min-h-0 flex-col">
        <DecksSidebarHeader />

        <div
          className={cn(
            "flex-1 overflow-y-auto p-4 pt-3",
            isMobile ? "pb-36" : "space-y-3"
          )}
        >
          <DecksSidebarList />
        </div>

        <DecksSidebarMobileBottomBar />

        <DeckCreateDialog />
      </div>
    </DecksSidebarProvider>
  );
}
