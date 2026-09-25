import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireGameFeature } from "@/lib/routing/game-feature-route";

export const metadata: Metadata = {
  title: "Creators",
  description:
    "Creator program and community voices for UniVersus on UVSDECKS.GG.",
};

export default async function CreatorsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ game: string }>;
}) {
  await requireGameFeature(params, "creators");
  return children;
}
