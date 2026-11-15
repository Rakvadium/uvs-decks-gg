"use client";

import { Library } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FloatingPageBar,
  FloatingPageLayout,
  FloatingPageTitle,
} from "@/components/shell/floating-page-bar";
import { MobileLargeTitle } from "@/components/shell/mobile-large-title";

export default function CollectionPageClient() {
  return (
    <FloatingPageLayout
      bar={
        <FloatingPageBar
          left={
            <FloatingPageTitle>Collection</FloatingPageTitle>
          }
        />
      }
    >
      <MobileLargeTitle className="mb-4">Collection</MobileLargeTitle>
      <EmptyState
        variant="page"
        icon={Library}
        title="Coming soon"
        description="Collection is on the way. Here is what you can look forward to."
      >
        <ul className="mt-6 max-w-md space-y-3 text-left text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Collection tracking</span>
              — log owned copies, variants, and progress across sets in one place.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Deck gaps</span>
              — see which cards you are missing from decks you save or browse.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Ownership filters</span>
              — deckbuilding filters that show only cards you own so lists stay realistic.
            </span>
          </li>
        </ul>
      </EmptyState>
    </FloatingPageLayout>
  );
}
