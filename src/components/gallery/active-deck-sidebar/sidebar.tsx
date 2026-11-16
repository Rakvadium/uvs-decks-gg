import { useCallback, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Layers } from "lucide-react";
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
    return <LoadingState size="sm" label="Loading deck" className="py-6" />;
  }

  if (!activeDeck) {
    return (
      <div className="p-4">
        <EmptyState
          variant="inline"
          title="No active deck"
          description="Select a deck to start adding cards"
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveSidebarAction("decks")}>
              <Layers />
              Open Decks
            </Button>
          }
        />
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
