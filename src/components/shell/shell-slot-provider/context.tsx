"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useShellSlotModel } from "./hook";
import type { ShellSlotContextValue } from "./types";

const ShellSlotContext = createContext<ShellSlotContextValue | null>(null);

export function ShellSlotProvider({ children }: { children: ReactNode }) {
  const value = useShellSlotModel();

  return <ShellSlotContext.Provider value={value}>{children}</ShellSlotContext.Provider>;
}

export function useShellSlot(): ShellSlotContextValue {
  const context = useContext(ShellSlotContext);

  if (!context) {
    throw new Error("useShellSlot must be used within ShellSlotProvider");
  }

  return context;
}
