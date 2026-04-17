import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · Community media",
  description:
    "Curate YouTube videos for the Community Universus Content section (admin only).",
};

export default function AdminCommunityMediaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
