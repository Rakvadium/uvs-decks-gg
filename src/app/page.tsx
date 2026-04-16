import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Card Gallery",
  description:
    "Browse UniVersus cards, then jump into decks, collection, and community tools on UVSDECKS.GG.",
};

export default function RootPage() {
  redirect("/gallery");
}
