"use client";

import { cn } from "@/lib/utils";
import { DeckSidebarItemProvider, useDeckSidebarItemContext } from "./context";
import { DeckSidebarItemActions } from "./actions";
import { DeckSidebarItemCounts } from "./counts";
import { DeckSidebarItemHeader } from "./header";
import type { DeckData } from "../types";

function DeckSidebarItemContent() {
  const { isActive } = useDeckSidebarItemContext();

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-border/50 bg-card/40 p-3 transition-colors",
        isActive && "border-primary/40 bg-primary/5 shadow-[0_0_20px_-12px_var(--primary)]"
      )}
    >
      <DeckSidebarItemHeader />
      <DeckSidebarItemCounts />
      <DeckSidebarItemActions />
    </div>
  );
}

export function DeckSidebarItem({ deck }: { deck: DeckData }) {
  return (
    <DeckSidebarItemProvider deck={deck}>
      <DeckSidebarItemContent />
    </DeckSidebarItemProvider>
  );
}
