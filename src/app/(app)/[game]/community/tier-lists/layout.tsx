import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tier lists",
  description:
    "Browse and create UniVersus tier lists — community rankings, card placement, and list sharing.",
};

export default function CommunityTierListsLayout({ children }: { children: ReactNode }) {
  return children;
}
