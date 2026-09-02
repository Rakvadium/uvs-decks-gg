"use client";

import { Library } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FloatingPageBar,
  FloatingPageLayout,
  FloatingPageTitle,
} from "@/components/shell/floating-page-bar";
import { PageHeading, SectionHeading } from "@/components/ui/typography-headings";

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
      <div className="mb-6 md:hidden">
        <PageHeading>
          Collection
        </PageHeading>
      </div>
      <Card className="border-2 border-dashed border-border/80">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-border/80"
            style={{ boxShadow: "var(--chrome-deck-state-icon-shadow)" }}
          >
            <Library className="h-8 w-8 text-muted-foreground" />
          </div>
          <SectionHeading className="mb-2">
            Coming soon
          </SectionHeading>
          <p className="chrome-label-case mb-8 max-w-xl text-center text-sm text-muted-foreground">
            Collection is on the way. Here is what you can look forward to.
          </p>
          <ul className="max-w-md space-y-3 text-sm text-muted-foreground">
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
        </CardContent>
      </Card>
    </FloatingPageLayout>
  );
}
