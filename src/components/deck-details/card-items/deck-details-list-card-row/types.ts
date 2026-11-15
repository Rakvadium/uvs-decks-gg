import type { RefObject } from "react";
import type { DeckSection } from "@/lib/deck/display-config";
import type { UseTcgDraggableResult } from "@/lib/dnd";
import type { CachedCard } from "@/lib/universus/card-store";
import type { DeckListEntry } from "../../deck-list-utils";

export type DeckDetailsListCardRowProps = {
  entry: DeckListEntry;
};

export interface DeckCardRowModel {
  card: CachedCard;
  backCard: CachedCard | null;
  count: number;
  sectionKey: DeckSection;
  isOwner: boolean;
  moveTargets: DeckSection[];
  isDragging: boolean;
  dragPreviewImageRef: RefObject<HTMLImageElement | null>;
  dragHandleProps: UseTcgDraggableResult["dragHandleProps"];
  canAddToDeck: boolean;
  canMoveToSection: (target: DeckSection) => boolean;
  handleCardClick: () => void;
  handlePointerEnter: (rect: DOMRect) => void;
  handlePointerMove: (rect: DOMRect) => void;
  onHoverLeave: () => void;
  addCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  removeCard: (cardId: CachedCard["_id"], section: DeckSection) => void;
  moveCard: (cardId: CachedCard["_id"], from: DeckSection, to: DeckSection) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}
