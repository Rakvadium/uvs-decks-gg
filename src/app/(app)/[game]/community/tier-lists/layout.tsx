import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireGameFeature } from "@/lib/routing/game-feature-route";

export const metadata: Metadata = {
  title: "Tier lists",
  description:
    "Browse and create UniVersus tier lists — community rankings, card placement, and list sharing.",
};

export default async function CommunityTierListsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ game: string }>;
}) {
  await requireGameFeature(params, "tierLists");
  return children;
}
