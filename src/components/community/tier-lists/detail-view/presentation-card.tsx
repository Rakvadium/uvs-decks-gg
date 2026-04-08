"use client";

import { CardGridItem } from "@/components/universus";
import { useCommunityTierListDetailContext } from "./context";

export function CommunityTierListPresentationCard() {
  const { presentationCard, filteredPoolCardIds, getBackCard } = useCommunityTierListDetailContext();

  if (!presentationCard) {
    return null;
  }

  return (
    <div className="pointer-events-auto w-72 rounded-bl-none rounded-br-none rounded-tl-xl rounded-tr-none  border-b-0  p-3 pb-2  md:w-80">
      <CardGridItem
        card={presentationCard}
        backCard={getBackCard(presentationCard)}
        dragSourceId="tier-list:pool"
        showDeckActions={false}
      />
    </div>
  );
}
