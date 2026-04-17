"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useShellSlotModel } from "./hook";
import type {
  ShellSlotActions,
  ShellSlotContextValue,
  SlotArea,
  SlotRegistration,
} from "./types";

const ShellSlotActionsContext = createContext<ShellSlotActions | null>(null);
const ShellSlotActiveSidebarContext = createContext<string | null | undefined>(undefined);
const ShellSlotDataContext = createContext<{
  slots: Map<SlotArea, SlotRegistration[]>;
  sidebarWidth: number;
} | null>(null);

export function ShellSlotProvider({ children }: { children: ReactNode }) {
  const { actions, activeSidebarActionId, slotData } = useShellSlotModel();

  return (
    <ShellSlotActionsContext.Provider value={actions}>
      <ShellSlotActiveSidebarContext.Provider value={activeSidebarActionId}>
        <ShellSlotDataContext.Provider value={slotData}>
          {children}
        </ShellSlotDataContext.Provider>
      </ShellSlotActiveSidebarContext.Provider>
    </ShellSlotActionsContext.Provider>
  );
}

export function useShellSlotActions(): ShellSlotActions {
  const context = useContext(ShellSlotActionsContext);
  if (!context) {
    throw new Error("useShellSlotActions must be used within ShellSlotProvider");
  }
  return context;
}

export function useActiveSidebarActionId(): string | null {
  const context = useContext(ShellSlotActiveSidebarContext);
  if (context === undefined) {
    throw new Error("useActiveSidebarActionId must be used within ShellSlotProvider");
  }
  return context;
}

export function useShellSlotData(): {
  slots: Map<SlotArea, SlotRegistration[]>;
  sidebarWidth: number;
} {
  const context = useContext(ShellSlotDataContext);
  if (!context) {
    throw new Error("useShellSlotData must be used within ShellSlotProvider");
  }
  return context;
}

export function useShellSlots(): Map<SlotArea, SlotRegistration[]> {
  return useShellSlotData().slots;
}

export function useSidebarWidth(): number {
  return useShellSlotData().sidebarWidth;
}

export function useShellSlot(): ShellSlotContextValue {
  const actions = useShellSlotActions();
  const activeSidebarActionId = useActiveSidebarActionId();
  const { slots, sidebarWidth } = useShellSlotData();

  return {
    state: { slots, activeSidebarActionId, sidebarWidth },
    actions,
  };
}
