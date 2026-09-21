"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type GalleryMobileFilterPage =
  | "root"
  | "format"
  | "sets"
  | "type"
  | "symbols"
  | "keywords"
  | "stats"
  | "rarity";

interface GalleryMobileFilterNavContextValue {
  page: GalleryMobileFilterPage;
  direction: "forward" | "back";
  push: (page: Exclude<GalleryMobileFilterPage, "root">) => void;
  back: () => void;
  reset: () => void;
}

const GalleryMobileFilterNavContext = createContext<GalleryMobileFilterNavContextValue | null>(null);

export function GalleryMobileFilterNavProvider({
  children,
  initialPage = "root",
  onNavigate,
}: {
  children: ReactNode;
  initialPage?: GalleryMobileFilterPage;
  onNavigate?: (page: GalleryMobileFilterPage) => void;
}) {
  const [page, setPage] = useState<GalleryMobileFilterPage>(initialPage);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const externalPage = useRef(initialPage);

  useEffect(() => {
    if (initialPage === externalPage.current) return;
    externalPage.current = initialPage;
    setDirection(initialPage === "root" ? "back" : "forward");
    setPage(initialPage);
  }, [initialPage]);

  const push = useCallback((next: Exclude<GalleryMobileFilterPage, "root">) => {
    externalPage.current = next;
    setDirection("forward");
    setPage(next);
    onNavigate?.(next);
  }, [onNavigate]);

  const back = useCallback(() => {
    externalPage.current = "root";
    setDirection("back");
    setPage("root");
    onNavigate?.("root");
  }, [onNavigate]);

  const reset = useCallback(() => {
    externalPage.current = "root";
    setDirection("back");
    setPage("root");
    onNavigate?.("root");
  }, [onNavigate]);

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
