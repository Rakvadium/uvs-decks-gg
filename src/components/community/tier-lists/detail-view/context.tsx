"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCommunityTierListDetailModel } from "./hook";

type CommunityTierListDetailContextValue = ReturnType<typeof useCommunityTierListDetailModel>;

const CommunityTierListDetailContext = createContext<CommunityTierListDetailContextValue | null>(null);

export function CommunityTierListDetailProvider({
  tierListId,
  children,
}: {
  tierListId: string;
  children: ReactNode;
}) {
  const value = useCommunityTierListDetailModel(tierListId);

  return (
    <CommunityTierListDetailContext.Provider value={value}>
      {children}
    </CommunityTierListDetailContext.Provider>
  );
}

export function useCommunityTierListDetailContext() {
  const context = useOptionalCommunityTierListDetailContext();

  if (!context) {
    throw new Error("useCommunityTierListDetailContext must be used within CommunityTierListDetailProvider");
  }

  return context;
}

export function useOptionalCommunityTierListDetailContext() {
  return useContext(CommunityTierListDetailContext);
}
