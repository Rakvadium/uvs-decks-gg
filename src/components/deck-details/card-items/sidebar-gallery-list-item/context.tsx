"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useSidebarGalleryListItemModel,
  type SidebarGalleryListItemModel,
} from "./hook";
import type { SidebarGalleryListItemProps } from "./types";

const SidebarGalleryListItemContext = createContext<SidebarGalleryListItemModel | null>(null);

export function SidebarGalleryListItemProvider({ children, ...props }: SidebarGalleryListItemProps & { children: ReactNode }) {
  const value = useSidebarGalleryListItemModel(props);

  return <SidebarGalleryListItemContext.Provider value={value}>{children}</SidebarGalleryListItemContext.Provider>;
}

export function useSidebarGalleryListItemContext() {
  const context = useContext(SidebarGalleryListItemContext);

  if (!context) {
    throw new Error("useSidebarGalleryListItemContext must be used within SidebarGalleryListItemProvider");
  }

  return context;
}
