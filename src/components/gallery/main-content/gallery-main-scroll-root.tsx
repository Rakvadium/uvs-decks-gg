"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type GalleryMainScrollRootContextValue = {
  scrollRef: RefObject<HTMLDivElement | null>;
  scrollRootElement: HTMLDivElement | null;
  attachScrollRootRef: (el: HTMLDivElement | null) => void;
};

const GalleryMainScrollRootContext = createContext<GalleryMainScrollRootContextValue | null>(null);

export function GalleryMainScrollRootProvider({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollRootElement, setScrollRootElement] = useState<HTMLDivElement | null>(null);

  const attachScrollRootRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    setScrollRootElement((prev) => (prev === el ? prev : el));
  }, []);

  const value = useMemo(
    (): GalleryMainScrollRootContextValue => ({
      scrollRef,
      scrollRootElement,
      attachScrollRootRef,
    }),
    [scrollRootElement, attachScrollRootRef]
  );

  return (
    <GalleryMainScrollRootContext.Provider value={value}>{children}</GalleryMainScrollRootContext.Provider>
  );
}

export function useGalleryMainScrollRoot(): GalleryMainScrollRootContextValue {
  const ctx = useContext(GalleryMainScrollRootContext);
  if (!ctx) {
    throw new Error("useGalleryMainScrollRoot requires GalleryMainScrollRootProvider");
  }
  return ctx;
}

export function useGalleryMainScrollRootRef(): RefObject<HTMLDivElement | null> {
  return useGalleryMainScrollRoot().scrollRef;
}

export function useGalleryMainScrollRootElement(): HTMLDivElement | null {
  return useGalleryMainScrollRoot().scrollRootElement;
}
