"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useActiveDeckCharacterPanelModel,
  type ActiveDeckCharacterPanelModel,
} from "./hook";

const ActiveDeckCharacterPanelContext = createContext<ActiveDeckCharacterPanelModel | null>(null);

export function ActiveDeckCharacterPanelProvider({ children }: { children: ReactNode }) {
  const value = useActiveDeckCharacterPanelModel();
  return (
    <ActiveDeckCharacterPanelContext.Provider value={value}>
      {children}
    </ActiveDeckCharacterPanelContext.Provider>
  );
}

export function useActiveDeckCharacterPanelContext() {
  const context = useContext(ActiveDeckCharacterPanelContext);

  if (!context) {
    throw new Error(
      "useActiveDeckCharacterPanelContext must be used within ActiveDeckCharacterPanelProvider"
    );
  }

  return context;
}
