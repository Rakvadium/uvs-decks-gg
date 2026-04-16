"use client";

import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";

const GalleryMainScrollRootRefContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export function GalleryMainScrollRootProvider({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <GalleryMainScrollRootRefContext.Provider value={scrollRef}>{children}</GalleryMainScrollRootRefContext.Provider>
  );
}

export function useGalleryMainScrollRootRef(): RefObject<HTMLDivElement | null> {
  const ctx = useContext(GalleryMainScrollRootRefContext);
  if (!ctx) {
    throw new Error("useGalleryMainScrollRootRef requires GalleryMainScrollRootProvider");
  }
  return ctx;
}
