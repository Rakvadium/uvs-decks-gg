"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

type GalleryMainScrollRootContextValue = {
  scrollRef: RefObject<HTMLDivElement | null>;
  setScrollRef: (el: HTMLDivElement | null) => void;
  scrollElement: HTMLDivElement | null;
};

const GalleryMainScrollRootRefContext = createContext<GalleryMainScrollRootContextValue | null>(null);

export function GalleryMainScrollRootProvider({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const setScrollRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    setScrollElement(el);
  }, []);

  const value = useMemo<GalleryMainScrollRootContextValue>(
    () => ({ scrollRef, setScrollRef, scrollElement }),
    [scrollElement, setScrollRef]
  );

  return (
    <GalleryMainScrollRootRefContext.Provider value={value}>{children}</GalleryMainScrollRootRefContext.Provider>
  );
}

export function useGalleryMainScrollRootRef(): RefObject<HTMLDivElement | null> {
  const ctx = useContext(GalleryMainScrollRootRefContext);
  if (!ctx) {
    throw new Error("useGalleryMainScrollRootRef requires GalleryMainScrollRootProvider");
  }
  return ctx.scrollRef;
}

export function useGalleryMainScrollSetRef(): (el: HTMLDivElement | null) => void {
  const ctx = useContext(GalleryMainScrollRootRefContext);
  if (!ctx) {
    throw new Error("useGalleryMainScrollSetRef requires GalleryMainScrollRootProvider");
  }
  return ctx.setScrollRef;
}

export function useGalleryMainScrollElement(): HTMLDivElement | null {
  const ctx = useContext(GalleryMainScrollRootRefContext);
  if (!ctx) {
    throw new Error("useGalleryMainScrollElement requires GalleryMainScrollRootProvider");
  }
  return ctx.scrollElement;
}
