import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · Media review",
  description:
    "Review moderated uploads flagged for human decision (admin only).",
};

export default function AdminModerationLayout({ children }: { children: ReactNode }) {
  return children;
}
