"use client";

import { createContext, useContext, type ReactNode } from "react";

export type GalleryMobileFilterDisplayMode = "card" | "list";

export interface GalleryMobileFilterDisplayOverride {
  viewMode: GalleryMobileFilterDisplayMode;
  setViewMode: (mode: GalleryMobileFilterDisplayMode) => void;
}

const GalleryMobileFilterDisplayContext = createContext<GalleryMobileFilterDisplayOverride | null>(null);

export function GalleryMobileFilterDisplayProvider({
  value,
  children,
}: {
  value: GalleryMobileFilterDisplayOverride | undefined;
  children: ReactNode;
}) {
  return (
    <GalleryMobileFilterDisplayContext.Provider value={value ?? null}>
      {children}
    </GalleryMobileFilterDisplayContext.Provider>
  );
}

export function useGalleryMobileFilterDisplayOverride() {
  return useContext(GalleryMobileFilterDisplayContext);
}
