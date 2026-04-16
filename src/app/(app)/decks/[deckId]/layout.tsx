import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Props = {
  children: ReactNode;
  params: Promise<{ deckId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return {
      title: "Deck",
      description: "Open this UniVersus deck in the UVSDECKS.GG deck editor.",
    };
  }
  try {
    const deck = await fetchQuery(api.decks.getById, {
      deckId: deckId as Id<"decks">,
    });
    if (!deck) {
      return {
        title: "Deck",
        description: "This deck could not be found or is unavailable.",
      };
    }
    return {
      title: deck.name,
      description:
        deck.description?.trim() ||
        `UniVersus deck "${deck.name}" on UVSDECKS.GG — edit cards, stats, and share your build.`,
    };
  } catch {
    return {
      title: "Deck",
      description: "Open this UniVersus deck in the UVSDECKS.GG deck editor.",
    };
  }
}

export default function DeckDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
