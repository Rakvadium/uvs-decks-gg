import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · Sets",
  description:
    "Manage UniVersus card sets — codes, release status, and card counts (admin only).",
};

export default function AdminSetsLayout({ children }: { children: ReactNode }) {
  return children;
}
