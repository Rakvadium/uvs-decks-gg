"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";

type DeckDetailsTopBarContextValue = NonNullable<ReturnType<typeof useDeckDetailsOptional>>;

const DeckDetailsTopBarContext = createContext<DeckDetailsTopBarContextValue | null>(null);

export function DeckDetailsTopBarProvider({ children }: { children: ReactNode }) {
  const context = useDeckDetailsOptional();

  if (!context) return null;

  return <DeckDetailsTopBarContext.Provider value={context}>{children}</DeckDetailsTopBarContext.Provider>;
}

export function useDeckDetailsTopBarContext() {
  const context = useContext(DeckDetailsTopBarContext);

  if (!context) {
    throw new Error("useDeckDetailsTopBarContext must be used within DeckDetailsTopBarProvider");
  }

  return context;
}
