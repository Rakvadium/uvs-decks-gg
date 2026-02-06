"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useGallerySidebarModel, type GallerySidebarModel } from "./hook";

const GallerySidebarContext = createContext<GallerySidebarModel | null>(null);

export function GallerySidebarProvider({ children }: { children: ReactNode }) {
  const value = useGallerySidebarModel();

  return <GallerySidebarContext.Provider value={value}>{children}</GallerySidebarContext.Provider>;
}

export function useGallerySidebarContext() {
  const context = useContext(GallerySidebarContext);

  if (!context) {
    throw new Error("useGallerySidebarContext must be used within GallerySidebarProvider");
  }

  return context;
}

export function useAvailableGallerySidebarContext() {
  const context = useGallerySidebarContext();

  if (!context.gallery) {
    throw new Error("useAvailableGallerySidebarContext requires gallery filters context");
  }

  return context as GallerySidebarModel & {
    gallery: NonNullable<GallerySidebarModel["gallery"]>;
  };
}
