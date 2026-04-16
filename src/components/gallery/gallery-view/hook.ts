"use client";

import { useMemo } from "react";
import { Layers } from "lucide-react";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { DecksSidebar } from "../decks-sidebar";
import {
  ActiveDeckFooter,
  ActiveDeckHeader,
  ActiveDeckIcon,
  ActiveDeckSidebar,
} from "../gallery-active-deck-sidebar";

export function useGalleryView() {
  const { activeDeck } = useActiveDeck();
  const activeDeckLabel = activeDeck?.name ?? "Active Deck";

  const activeDeckSlotOptions = useMemo(
    () => ({
      label: activeDeckLabel,
      icon: ActiveDeckIcon,
      header: ActiveDeckHeader,
      footer: ActiveDeckFooter,
    }),
    [activeDeckLabel]
  );

  const decksSlotOptions = useMemo(
    () => ({
      label: "Decks",
      icon: Layers,
      priority: 1,
    }),
    []
  );

  useRegisterSlot("right-sidebar", "active-deck", ActiveDeckSidebar, activeDeckSlotOptions);
  useRegisterSlot("right-sidebar", "decks", DecksSidebar, decksSlotOptions);
}
