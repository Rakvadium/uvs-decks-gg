import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "Track your UniVersus card collection — owned copies, progress, and inventory alongside your decks.",
};

export default function CollectionLayout({ children }: { children: ReactNode }) {
  return children;
}
