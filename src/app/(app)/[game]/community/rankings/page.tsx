import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Rankings",
  description:
    "Community tier list rankings for UniVersus on UVSDECKS.GG — redirected to the tier lists hub.",
};

export default function CommunityRankingsPage() {
  redirect("/community/tier-lists?tab=rankings");
}
