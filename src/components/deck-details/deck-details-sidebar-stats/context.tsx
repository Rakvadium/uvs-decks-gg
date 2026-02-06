"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useStatsSidebarModel, type StatsSidebarModel } from "./hook";

const StatsSidebarContext = createContext<StatsSidebarModel | null>(null);

export function StatsSidebarProvider({ children }: { children: ReactNode }) {
  const value = useStatsSidebarModel();

  return <StatsSidebarContext.Provider value={value}>{children}</StatsSidebarContext.Provider>;
}

export function useStatsSidebarContext() {
  const context = useContext(StatsSidebarContext);

  if (!context) {
    throw new Error("useStatsSidebarContext must be used within StatsSidebarProvider");
  }

  return context;
}
