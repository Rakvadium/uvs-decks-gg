import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · Formats",
  description:
    "Manage UniVersus formats and legality (admin only).",
};

export default function AdminFormatsLayout({ children }: { children: ReactNode }) {
  return children;
}
