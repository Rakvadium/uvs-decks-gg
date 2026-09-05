"use client";

import { DecksSidebarProvider } from "./context";
import { DeckCreateDialog } from "./create-dialog";
import { DecksSidebarHeader } from "./header";
import { DecksSidebarList } from "./list";

export function DecksSidebar() {
  return (
    <DecksSidebarProvider>
      <div className="flex h-full min-h-0 flex-col">
        <DecksSidebarHeader />

        <div className="flex-1 overflow-y-auto p-4 pt-3">
          <DecksSidebarList />
        </div>

        <DeckCreateDialog />
      </div>
    </DecksSidebarProvider>
  );
}
