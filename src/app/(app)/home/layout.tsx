import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Your UniVersus command center — stats, shortcuts to the gallery, deck builder, collection, and community.",
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return children;
}
