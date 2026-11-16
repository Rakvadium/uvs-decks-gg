"use client";

import Link from "next/link";
import { Layers, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DECK_SECTION_CONFIG as SECTION_CONFIG } from "@/lib/deck/display-config";
import { useDeckCardsSectionContext } from "../deck-details-cards-section-context";

export function DeckCardsEmptyState() {
  const { activeSection } = useDeckCardsSectionContext();

  return (
    <EmptyState
      icon={Layers}
      title={`No cards in ${SECTION_CONFIG[activeSection].label.toLowerCase()}`}
      action={
        <Button variant="neon" size="sm" asChild>
          <Link href="/gallery">
            <LayoutGrid />
            Browse Gallery
          </Link>
        </Button>
      }
    />
  );
}
