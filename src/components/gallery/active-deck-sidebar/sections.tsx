import { useCallback, type ReactNode } from "react";
import type { CachedCard } from "@/lib/universus/card-store";
import { useEnabledDeckSections, visibleDeckSections } from "@/lib/deck/use-deck-sections";
import { type DeckSection, useActiveDeckSectionsContext } from "./sections-context";
import { ActiveDeckSection } from "./section";
import { ActiveDeckSectionsProvider } from "./sections-context";

interface ActiveDeckSectionsProps {
  onHoverEnter: (card: CachedCard, rect: DOMRect) => void;
  onHoverMove: (rect: DOMRect) => void;
  onHoverLeave: () => void;
}

function ActiveDeckSectionList({ renderSection }: { renderSection: (sectionKey: DeckSection) => ReactNode }) {
  const { sectionCount } = useActiveDeckSectionsContext();
  const sections = visibleDeckSections(useEnabledDeckSections(), sectionCount);
  return <div className="space-y-3">{sections.map(renderSection)}</div>;
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
      <ActiveDeckSectionList renderSection={renderSection} />
    </ActiveDeckSectionsProvider>
  );
}
