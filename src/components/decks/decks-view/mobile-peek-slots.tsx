"use client";

import { useMemo } from "react";
import { useConvexAuth } from "convex/react";
import {
  ActiveDeckFooter,
  ActiveDeckHeader,
  ActiveDeckIcon,
  ActiveDeckSidebar,
} from "@/components/gallery/gallery-active-deck-sidebar";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";

function DecksActiveDeckPeekSlot() {
  const { activeDeck } = useActiveDeck();
  const label = activeDeck?.name ?? "Active Deck";

  const options = useMemo(
    () => ({
      label,
      tabLabel: "Active Deck",
      icon: ActiveDeckIcon,
      mobileAccessory: true,
      iconFit: "media" as const,
      header: ActiveDeckHeader,
      footer: ActiveDeckFooter,
    }),
    [label]
  );

  useRegisterSlot("right-sidebar", "active-deck", ActiveDeckSidebar, options);
  return null;
}

export function DecksMobilePeekSlots() {
  const isMobile = useIsMobile();
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (!isMobile || isLoading || !isAuthenticated) return null;
  return <DecksActiveDeckPeekSlot />;
}
