import { useCallback } from "react";
import type { CachedCard } from "@/lib/universus/card-store";
import { DECK_SECTION_KEYS, type DeckSection } from "./sections-context";
import { ActiveDeckSection } from "./section";
import { ActiveDeckSectionsProvider } from "./sections-context";

interface ActiveDeckSectionsProps {
  onHoverEnter: (card: CachedCard, rect: DOMRect) => void;
  onHoverMove: (rect: DOMRect) => void;
  onHoverLeave: () => void;
}

export function ActiveDeckSections({
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
}: ActiveDeckSectionsProps) {
  const renderSection = useCallback(
    (sectionKey: DeckSection) => (
      <ActiveDeckSection key={sectionKey} sectionKey={sectionKey} />
    ),
    []
  );

  return (
    <ActiveDeckSectionsProvider
      onHoverEnter={onHoverEnter}
      onHoverMove={onHoverMove}
      onHoverLeave={onHoverLeave}
    >
      <div className="space-y-3">{DECK_SECTION_KEYS.map(renderSection)}</div>
    </ActiveDeckSectionsProvider>
  );
}
