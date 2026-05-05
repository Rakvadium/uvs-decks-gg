"use client";

import { useMemo } from "react";
import { useConvexAuth } from "convex/react";
import { Layers } from "lucide-react";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { DecksSidebar } from "../decks-sidebar";
import {
  ActiveDeckFooter,
  ActiveDeckHeader,
  ActiveDeckIcon,
  ActiveDeckSidebar,
} from "../gallery-active-deck-sidebar";
import { GalleryGuestDecksIcon, GalleryGuestDecksSidebar } from "../gallery-guest-decks-sidebar";

function GalleryAuthenticatedSidebarSlots() {
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
  return null;
}

function GalleryGuestSidebarSlot() {
  const guestSlotOptions = useMemo(
    () => ({
      label: "Deck tools",
      icon: GalleryGuestDecksIcon,
      priority: 0,
    }),
    []
  );

  useRegisterSlot("right-sidebar", "gallery-guest-decks", GalleryGuestDecksSidebar, guestSlotOptions);
  return null;
}

export function GalleryRightSidebarSlots() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <GalleryAuthenticatedSidebarSlots />;
  return <GalleryGuestSidebarSlot />;
}
