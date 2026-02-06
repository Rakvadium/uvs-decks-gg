import { useCallback, useState } from "react";
import { Hexagon, Loader2 } from "lucide-react";
import { CardHoverPreviewPortal } from "@/components/deck/shared";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { type CachedCard } from "@/lib/universus";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { ActiveDeckCharacterPanel } from "./character-panel";
import { ActiveDeckSections } from "./sections";

export function ActiveDeckSidebar() {
  const { activeDeck, isLoading } = useActiveDeck();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hoveredCard, setHoveredCard] = useState<CachedCard | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  const handleHoverEnter = useCallback((card: CachedCard, rect: DOMRect) => {
    setHoveredCard(card);
    setHoveredRect(rect);
  }, []);

  const handleHoverMove = useCallback((rect: DOMRect) => {
    setHoveredRect(rect);
  }, []);

  const handleHoverLeave = useCallback(() => {
    setHoveredCard(null);
    setHoveredRect(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Loading deck
        </span>
      </div>
    );
  }

  if (!activeDeck) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hexagon className="h-5 w-5 text-primary/30" />
          <span className="text-sm font-mono uppercase tracking-wider">
            No Active Deck
          </span>
        </div>
        <p className="text-xs font-mono text-muted-foreground/60">
          Select a deck to start adding cards
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full space-y-3 overflow-y-auto p-4">
      <CardHoverPreviewPortal
        card={hoveredCard}
        rect={hoveredRect}
        prefersReducedMotion={prefersReducedMotion}
        width={220}
      />

      <ActiveDeckCharacterPanel />

      <ActiveDeckSections
        onHoverEnter={handleHoverEnter}
        onHoverMove={handleHoverMove}
        onHoverLeave={handleHoverLeave}
      />
    </div>
  );
}
