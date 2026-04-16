import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Community",
  description:
    "UniVersus community hub on UVSDECKS.GG — tier lists, rankings, creators, and shared meta.",
};

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return children;
}
