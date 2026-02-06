"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useActiveDeckSectionModel, type ActiveDeckSectionModel } from "./hook";
import type { ActiveDeckSectionProps } from "./types";

const ActiveDeckSectionContext = createContext<ActiveDeckSectionModel | null>(null);

export function ActiveDeckSectionProvider({ children, ...props }: ActiveDeckSectionProps & { children: ReactNode }) {
  const value = useActiveDeckSectionModel(props);

  return <ActiveDeckSectionContext.Provider value={value}>{children}</ActiveDeckSectionContext.Provider>;
}

export function useActiveDeckSectionContext() {
  const context = useContext(ActiveDeckSectionContext);

  if (!context) {
    throw new Error("useActiveDeckSectionContext must be used within ActiveDeckSectionProvider");
  }

  return context;
}
