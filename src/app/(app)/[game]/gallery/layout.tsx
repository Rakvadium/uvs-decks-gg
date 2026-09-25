import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Card Gallery",
  description:
    "Search and filter the full UniVersus card database — sets, rarities, symbols, and card details.",
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return children;
}
