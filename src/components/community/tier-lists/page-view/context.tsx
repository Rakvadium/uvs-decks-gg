"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCommunityTierListsPageModel } from "./hook";

type CommunityTierListsPageContextValue = ReturnType<typeof useCommunityTierListsPageModel>;

const CommunityTierListsPageContext = createContext<CommunityTierListsPageContextValue | null>(null);

export function CommunityTierListsPageProvider({ children }: { children: ReactNode }) {
  const value = useCommunityTierListsPageModel();

  return (
    <CommunityTierListsPageContext.Provider value={value}>
      {children}
    </CommunityTierListsPageContext.Provider>
  );
}

export function useCommunityTierListsPageContext() {
  const context = useOptionalCommunityTierListsPageContext();

  if (!context) {
    throw new Error("useCommunityTierListsPageContext must be used within CommunityTierListsPageProvider");
  }

  return context;
}

export function useOptionalCommunityTierListsPageContext() {
  return useContext(CommunityTierListsPageContext);
}
