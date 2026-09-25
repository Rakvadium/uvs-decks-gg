import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · Cards",
  description:
    "Manage UniVersus card records — search, review, and release unreleased cards (admin only).",
};

export default function AdminCardsLayout({ children }: { children: ReactNode }) {
  return children;
}
