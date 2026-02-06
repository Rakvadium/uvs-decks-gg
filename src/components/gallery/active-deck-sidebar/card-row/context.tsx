"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useActiveDeckCardRowModel, type ActiveDeckCardRowModel } from "./hook";
import type { ActiveDeckCardRowProps } from "./types";

const ActiveDeckCardRowContext = createContext<ActiveDeckCardRowModel | null>(null);

export function ActiveDeckCardRowProvider({ children, ...props }: ActiveDeckCardRowProps & { children: ReactNode }) {
  const value = useActiveDeckCardRowModel(props);

  return (
    <ActiveDeckCardRowContext.Provider value={value}>
      {children}
    </ActiveDeckCardRowContext.Provider>
  );
}

export function useActiveDeckCardRowContext() {
  const context = useContext(ActiveDeckCardRowContext);

  if (!context) {
    throw new Error("useActiveDeckCardRowContext must be used within ActiveDeckCardRowProvider");
  }

  return context;
}
