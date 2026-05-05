"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useShellSlotModel } from "./hook";
import type { ShellSlotActions, ShellSlotContextValue, SlotArea, SlotRegistration } from "./types";

const ShellSlotActionsContext = createContext<ShellSlotActions | null>(null);
const ShellSlotSlotsContext = createContext<Map<SlotArea, SlotRegistration[]> | null>(null);
const ShellSlotSidebarWidthContext = createContext<number | null>(null);
const ShellSlotActiveSidebarActionContext = createContext<string | null | undefined>(undefined);

export function ShellSlotProvider({ children }: { children: ReactNode }) {
  const model = useShellSlotModel();

  return (
    <ShellSlotActionsContext.Provider value={model.actions}>
      <ShellSlotSlotsContext.Provider value={model.slots}>
        <ShellSlotSidebarWidthContext.Provider value={model.sidebarWidth}>
          <ShellSlotActiveSidebarActionContext.Provider value={model.activeSidebarActionId}>
            {children}
          </ShellSlotActiveSidebarActionContext.Provider>
        </ShellSlotSidebarWidthContext.Provider>
      </ShellSlotSlotsContext.Provider>
    </ShellSlotActionsContext.Provider>
  );
}

function useShellSlotActionsInternal(): ShellSlotActions {
  const context = useContext(ShellSlotActionsContext);
  if (!context) {
    throw new Error("useShellSlotActions must be used within ShellSlotProvider");
  }
  return context;
}

function useShellSlotSlotsInternal(): Map<SlotArea, SlotRegistration[]> {
  const context = useContext(ShellSlotSlotsContext);
  if (!context) {
    throw new Error("useShellSlotSlots must be used within ShellSlotProvider");
  }
  return context;
}

function useShellSlotSidebarWidthInternal(): number {
  const context = useContext(ShellSlotSidebarWidthContext);
  if (context === null) {
    throw new Error("useShellSlotSidebarWidth must be used within ShellSlotProvider");
  }
  return context;
}

function useShellSlotActiveSidebarActionIdInternal(): string | null {
  const context = useContext(ShellSlotActiveSidebarActionContext);
  if (context === undefined) {
    throw new Error("useShellSlotActiveSidebarActionId must be used within ShellSlotProvider");
  }
  return context;
}

export function useShellSlotActions(): ShellSlotActions {
  return useShellSlotActionsInternal();
}

export function useShellSlotSlots(): Map<SlotArea, SlotRegistration[]> {
  return useShellSlotSlotsInternal();
}

export function useShellSlotSidebarWidth(): number {
  return useShellSlotSidebarWidthInternal();
}

export function useShellSlotActiveSidebarActionId(): string | null {
  return useShellSlotActiveSidebarActionIdInternal();
}

export function useShellSlot(): ShellSlotContextValue {
  const slots = useShellSlotSlotsInternal();
  const activeSidebarActionId = useShellSlotActiveSidebarActionIdInternal();
  const sidebarWidth = useShellSlotSidebarWidthInternal();
  const actions = useShellSlotActionsInternal();

  return useMemo(
    (): ShellSlotContextValue => ({
      state: {
        slots,
        activeSidebarActionId,
        sidebarWidth,
      },
      actions,
    }),
    [slots, activeSidebarActionId, sidebarWidth, actions]
  );
}
