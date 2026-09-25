import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Creators",
  description:
    "Creator program and community voices for UniVersus on UVSDECKS.GG.",
};

export default function CreatorsLayout({ children }: { children: ReactNode }) {
  return children;
}
