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
    <Link href={`/decks/${_id}`} className="block min-w-0">
      <div className="group relative flex h-[160px] min-w-0 overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_var(--primary)] sm:h-[180px]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-0 top-0 h-px w-[100px] bg-gradient-to-r from-primary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute bottom-0 right-0 h-px w-[100px] bg-gradient-to-l from-secondary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

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
