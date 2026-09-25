import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Decks",
  description:
    "Create, organize, and manage your UniVersus decks with UVSDECKS.GG deck tools.",
};

export default function DecksLayout({ children }: { children: ReactNode }) {
  return children;
}
