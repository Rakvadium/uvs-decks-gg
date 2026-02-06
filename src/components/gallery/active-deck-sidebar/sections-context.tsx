import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useCardData, type CachedCard } from "@/lib/universus";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { type DeckSectionCounts } from "@/lib/deck";
import {
  DECK_SECTION_KEYS,
  type DeckSection,
} from "@/lib/deck/display-config";
import { buildSectionGroups } from "./build-section-groups";
import type { SectionGroup } from "./types";

type SectionsByKey = Record<DeckSection, SectionGroup[]>;

interface ActiveDeckSectionsContextValue {
  groupsBySection: SectionsByKey;
  sectionCounts: DeckSectionCounts;
  sectionCount: (section: DeckSection) => number;
  addCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  removeCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  moveCard: (cardId: CachedCard["_id"], from: DeckSection, to: DeckSection) => void;
  onHoverEnter: (card: CachedCard, rect: DOMRect) => void;
  onHoverMove: (rect: DOMRect) => void;
  onHoverLeave: () => void;
}

const ActiveDeckSectionsContext = createContext<ActiveDeckSectionsContextValue | null>(
  null
);

interface ActiveDeckSectionsProviderProps {
  children: ReactNode;
  onHoverEnter: (card: CachedCard, rect: DOMRect) => void;
  onHoverMove: (rect: DOMRect) => void;
  onHoverLeave: () => void;
}

export function ActiveDeckSectionsProvider({
  children,
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
}: ActiveDeckSectionsProviderProps) {
  const {
    activeDeck,
    addCard,
    removeCard,
    moveCard,
    getSectionCardCount,
  } = useActiveDeck();
  const { cards: allCards } = useCardData();
  const cardMap = useCardIdMap(allCards);

  const groupsBySection = useMemo<SectionsByKey>(
    () => ({
      main: buildSectionGroups(activeDeck?.mainQuantities ?? {}, cardMap),
      side: buildSectionGroups(activeDeck?.sideQuantities ?? {}, cardMap),
      reference: buildSectionGroups(activeDeck?.referenceQuantities ?? {}, cardMap),
    }),
    [
      activeDeck?.mainQuantities,
      activeDeck?.referenceQuantities,
      activeDeck?.sideQuantities,
      cardMap,
    ]
  );

  const sectionCounts = useMemo<DeckSectionCounts>(
    () => ({
      mainCounts: activeDeck?.mainQuantities ?? {},
      sideCounts: activeDeck?.sideQuantities ?? {},
      referenceCounts: activeDeck?.referenceQuantities ?? {},
    }),
    [
      activeDeck?.mainQuantities,
      activeDeck?.referenceQuantities,
      activeDeck?.sideQuantities,
    ]
  );

  const value = useMemo(
    () => ({
      groupsBySection,
      sectionCounts,
      sectionCount: getSectionCardCount,
      addCard,
      removeCard,
      moveCard,
      onHoverEnter,
      onHoverMove,
      onHoverLeave,
    }),
    [
      groupsBySection,
      sectionCounts,
      getSectionCardCount,
      addCard,
      removeCard,
      moveCard,
      onHoverEnter,
      onHoverMove,
      onHoverLeave,
    ]
  );

  return (
    <ActiveDeckSectionsContext.Provider value={value}>
      {children}
    </ActiveDeckSectionsContext.Provider>
  );
}

export function useActiveDeckSectionsContext() {
  const context = useContext(ActiveDeckSectionsContext);

  if (!context) {
    throw new Error(
      "useActiveDeckSectionsContext must be used within ActiveDeckSectionsProvider"
    );
  }

  return context;
}

export { DECK_SECTION_KEYS };
export type { DeckSection };
