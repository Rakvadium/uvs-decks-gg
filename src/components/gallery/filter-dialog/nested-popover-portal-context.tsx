"use client";

import { createContext, useContext, type ReactNode } from "react";

const GalleryFilterNestedPopoverPortalContext = createContext<HTMLElement | null>(null);

export function GalleryFilterNestedPopoverPortalProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <GalleryFilterNestedPopoverPortalContext.Provider value={container}>
      {children}
    </GalleryFilterNestedPopoverPortalContext.Provider>
  );
}

export function useGalleryFilterNestedPopoverPortalContainer() {
  return useContext(GalleryFilterNestedPopoverPortalContext);
}
