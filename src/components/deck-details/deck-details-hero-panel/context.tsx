"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeckDetailsHeroPanelModel, type DeckDetailsHeroPanelModel } from "./hook";

const DeckDetailsHeroPanelContext = createContext<DeckDetailsHeroPanelModel | null>(null);

export function DeckDetailsHeroPanelProvider({ children }: { children: ReactNode }) {
  const value = useDeckDetailsHeroPanelModel();

  return (
    <DeckDetailsHeroPanelContext.Provider value={value}>
      {children}
    </DeckDetailsHeroPanelContext.Provider>
  );
}

export function useDeckDetailsHeroPanelContext() {
  const context = useContext(DeckDetailsHeroPanelContext);

  if (!context) {
    throw new Error("useDeckDetailsHeroPanelContext must be used within DeckDetailsHeroPanelProvider");
  }

  return context;
}
