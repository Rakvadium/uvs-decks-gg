"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type GalleryMobileFilterPage = "root" | "sets" | "keywords" | "stats";

interface GalleryMobileFilterNavContextValue {
  page: GalleryMobileFilterPage;
  direction: "forward" | "back";
  push: (page: Exclude<GalleryMobileFilterPage, "root">) => void;
  back: () => void;
  reset: () => void;
}

const GalleryMobileFilterNavContext = createContext<GalleryMobileFilterNavContextValue | null>(null);

export function GalleryMobileFilterNavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<GalleryMobileFilterPage>("root");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const push = useCallback((next: Exclude<GalleryMobileFilterPage, "root">) => {
    setDirection("forward");
    setPage(next);
  }, []);

  const back = useCallback(() => {
    setDirection("back");
    setPage("root");
  }, []);

  const reset = useCallback(() => {
    setDirection("back");
    setPage("root");
  }, []);

  const value = useMemo(
    (): GalleryMobileFilterNavContextValue => ({ page, direction, push, back, reset }),
    [page, direction, push, back, reset]
  );

  return <GalleryMobileFilterNavContext.Provider value={value}>{children}</GalleryMobileFilterNavContext.Provider>;
}

export function useGalleryMobileFilterNav() {
  const context = useContext(GalleryMobileFilterNavContext);
  if (!context) {
    throw new Error("useGalleryMobileFilterNav must be used within GalleryMobileFilterNavProvider");
  }
  return context;
}
