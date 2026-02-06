"use client";

import { DecksSidebarProvider } from "./context";
import { DeckCreateDialog } from "./create-dialog";
import { DecksSidebarHeader } from "./header";
import { DecksSidebarList } from "./list";

export function DecksSidebar() {
  return (
    <DecksSidebarProvider>
      <div className="flex h-full flex-col">
        <DecksSidebarHeader />

        <div className="flex-1 space-y-3 overflow-y-auto p-4 pt-3">
          <DecksSidebarList />
        </div>

        <DeckCreateDialog />
      </div>
    </DecksSidebarProvider>
  );
}
