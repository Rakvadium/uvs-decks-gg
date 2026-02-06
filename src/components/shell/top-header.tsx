"use client";

import { SlotRenderer, useShellSlot } from "./shell-slot-provider";

export function TopHeader() {
  const { state } = useShellSlot();
  const topBarSlots = state.slots.get("top-bar") ?? [];

  if (topBarSlots.length === 0) return null;

  return (
    <header className="relative flex min-h-12 shrink-0 items-center py-1 bg-sidebar border-b border-sidebar-border/50 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex-1 flex items-center px-2 overflow-hidden relative z-10">
        <SlotRenderer area="top-bar" />
      </div>
    </header>
  );
}
