import { useCallback, useState } from "react";
import { Hexagon, Layers, Loader2 } from "lucide-react";
import { CardHoverPreviewPortal } from "@/components/deck/shared";
import { TeamEditableWriteConflictBanner } from "@/components/deck/team-editable-write-conflict-banner";
import { useShellSlotActions } from "@/components/shell/shell-slot-provider";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { CachedCard } from "@/lib/universus/card-store";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { ActiveDeckCharacterPanel } from "./character-panel";
import { ActiveDeckSections } from "./sections";

export function ActiveDeckSidebar() {
  const { activeDeck, isLoading } = useActiveDeck();
  const { setActiveSidebarAction } = useShellSlotActions();
  const isMobile = useIsMobile();
  const [hoveredCard, setHoveredCard] = useState<CachedCard | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  const handleHoverEnter = useCallback((card: CachedCard, rect: DOMRect) => {
    if (isMobile) return;
    setHoveredCard(card);
    setHoveredRect(rect);
  }, [isMobile]);

  const handleHoverMove = useCallback((rect: DOMRect) => {
    if (isMobile) return;
    setHoveredRect(rect);
  }, [isMobile]);

  const handleHoverLeave = useCallback(() => {
    if (isMobile) return;
    setHoveredCard(null);
    setHoveredRect(null);
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="chrome-label-case text-sm text-muted-foreground">
          Loading deck
        </span>
      </div>
    );
  }

  if (!activeDeck) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-dashed border-border/50 bg-card/30 px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Hexagon className="h-5 w-5 text-primary/30" />
            <span className="chrome-label-case text-sm">
              No Active Deck
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Select a deck to start adding cards
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setActiveSidebarAction("decks")}
          >
            <Layers className="h-3.5 w-3.5" />
            Open Decks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full space-y-3 overflow-y-auto p-4">
      <TeamEditableWriteConflictBanner />
      <CardHoverPreviewPortal
        card={isMobile ? null : hoveredCard}
        rect={isMobile ? null : hoveredRect}
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
