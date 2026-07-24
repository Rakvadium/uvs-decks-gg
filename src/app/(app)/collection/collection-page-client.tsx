"use client";

import { Library } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/typography-headings";

export default function CollectionPageClient() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:h-full">
      <Card className="border-2 border-dashed border-primary/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-primary/40"
            style={{ boxShadow: "var(--chrome-deck-state-icon-shadow)" }}
          >
            <Library className="h-8 w-8 text-primary" />
          </div>
          <SectionHeading className="mb-2 text-lg font-display font-bold uppercase tracking-wider">
            Coming soon
          </SectionHeading>
          <p className="mb-8 max-w-xl text-center text-sm font-mono uppercase tracking-wider text-muted-foreground">
            Collection is on the way. Here is what you can look forward to.
          </p>
          <ul className="max-w-md space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>
                <span className="font-medium text-foreground">Collection tracking</span>
                — log owned copies, variants, and progress across sets in one place.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>
                <span className="font-medium text-foreground">Deck gaps</span>
                — see which cards you are missing from decks you save or browse.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>
                <span className="font-medium text-foreground">Ownership filters</span>
                — deckbuilding filters that show only cards you own so lists stay realistic.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
