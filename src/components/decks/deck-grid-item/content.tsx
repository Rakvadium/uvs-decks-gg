"use client";

import Link from "next/link";
import { DeckGridItemProvider, useDeckGridItemContext } from "./context";
import { DeckGridItemDetailsPanel } from "./details-panel";
import { DeckGridItemMediaPanel } from "./media-panel";
import type { DeckGridItemProps } from "./types";

function DeckGridItemCard() {
  const {
    deck: { _id },
  } = useDeckGridItemContext();

  return (
    <Link href={`/decks/${_id}`}>
      <div className="group relative flex h-[180px] overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-[var(--chrome-elevation-low)] transition-all duration-150 hover:border-[var(--chrome-deck-grid-border-hover)] hover:shadow-[var(--chrome-deck-grid-shadow-hover)]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" style={{ opacity: "var(--chrome-deck-grid-accent-line)" as unknown as number }} />

        <div className="absolute left-0 top-0 h-px w-[100px] bg-gradient-to-r from-primary/50 to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-[var(--chrome-deck-grid-accent-line)]" />
        <div className="absolute bottom-0 right-0 h-px w-[100px] bg-gradient-to-l from-secondary/50 to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-[var(--chrome-deck-grid-accent-line)]" />

        <DeckGridItemMediaPanel />
        <DeckGridItemDetailsPanel />
      </div>
    </Link>
  );
}

export function DeckGridItem(props: DeckGridItemProps) {
  return (
    <DeckGridItemProvider {...props}>
      <DeckGridItemCard />
    </DeckGridItemProvider>
  );
}
