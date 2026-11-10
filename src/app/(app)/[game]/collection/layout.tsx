import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireGameFeature } from "@/lib/routing/game-feature-route";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "Track your UniVersus card collection — owned copies, progress, and inventory alongside your decks.",
};

export default async function CollectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ game: string }>;
}) {
  await requireGameFeature(params, "collection");
  return children;
}
