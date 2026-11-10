import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireGameFeature } from "@/lib/routing/game-feature-route";

export const metadata: Metadata = {
  title: "Rankings",
  description:
    "Community tier list rankings for UniVersus on UVSDECKS.GG — redirected to the tier lists hub.",
};

export default async function CommunityRankingsPage({ params }: { params: Promise<{ game: string }> }) {
  await requireGameFeature(params, "rankings");
  redirect("/community/tier-lists?tab=rankings");
}
