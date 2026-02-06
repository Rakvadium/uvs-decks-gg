"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeckSidebarItemModel, type DeckSidebarItemModel } from "./hook";
import type { DeckData } from "../types";

const DeckSidebarItemContext = createContext<DeckSidebarItemModel | null>(null);

export function DeckSidebarItemProvider({ deck, children }: { deck: DeckData; children: ReactNode }) {
  const value = useDeckSidebarItemModel(deck);

  return <DeckSidebarItemContext.Provider value={value}>{children}</DeckSidebarItemContext.Provider>;
}

export function useDeckSidebarItemContext() {
  const context = useContext(DeckSidebarItemContext);

  if (!context) {
    throw new Error("useDeckSidebarItemContext must be used within DeckSidebarItemProvider");
  }

  return context;
}
