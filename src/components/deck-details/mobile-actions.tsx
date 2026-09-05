"use client";

import { Edit3 } from "lucide-react";
import { MobileActButton } from "@/components/shell/mobile-tab-bar/act-button";
import { MOBILE_TAB_ICON_CLASS } from "@/components/shell/mobile-tab-bar/metrics";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";

export function useDeckDetailsMobileActionsState() {
  const context = useDeckDetailsOptional();
  return Boolean(context?.isOwner && context.deck);
}

export function DeckDetailsMobileActions() {
  const context = useDeckDetailsOptional();
  if (!context?.isOwner || !context.deck) return null;

  return (
    <MobileActButton label="Edit deck details" tone="primary" onClick={() => context.startEditing()}>
      <Edit3 className={MOBILE_TAB_ICON_CLASS} strokeWidth={2.25} />
    </MobileActButton>
  );
}
