"use client";

import Link from "next/link";
import { Layers, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DECK_SECTION_CONFIG as SECTION_CONFIG } from "@/lib/deck/display-config";
import { useDeckCardsSectionContext } from "../deck-details-cards-section-context";

export function DeckCardsEmptyState() {
  const { activeSection } = useDeckCardsSectionContext();

  return (
    <Card className="border-dashed border-2 border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-primary/30 shadow-[0_0_20px_-5px_var(--primary)]">
          <Layers className="h-7 w-7 text-primary/50" />
        </div>
        <p className="mb-4 text-sm font-mono uppercase tracking-wider text-muted-foreground">
          No cards in {SECTION_CONFIG[activeSection].label.toLowerCase()}
        </p>
        <Link href="/gallery">
          <Button variant="neon" size="sm">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Browse Gallery
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
