"use client";

import { Copy, Edit3, Loader2 } from "lucide-react";
import { MobileActButton } from "@/components/shell/mobile-tab-bar/act-button";
import { MOBILE_TAB_ICON_CLASS } from "@/components/shell/mobile-tab-bar/metrics";
import { cn } from "@/lib/utils";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";

export function useDeckDetailsMobileActionsState() {
  const context = useDeckDetailsOptional();
  return Boolean(context?.deck);
}

export function DeckDetailsMobileActions() {
  const context = useDeckDetailsOptional();
  if (!context?.deck) return null;

  const isOwner = context.isOwner;
  const duplicateTone = isOwner ? "default" : "primary";

  return (
    <>
      <MobileActButton
        label="Duplicate deck"
        tone={duplicateTone}
        disabled={context.isDuplicating}
        onClick={context.requestDuplicate}
      >
        {context.isDuplicating ? (
          <Loader2 className={cn(MOBILE_TAB_ICON_CLASS, "animate-spin")} strokeWidth={2.25} />
        ) : (
          <Copy className={MOBILE_TAB_ICON_CLASS} strokeWidth={2.25} />
        )}
      </MobileActButton>
      {isOwner ? (
        <MobileActButton label="Edit deck details" tone="primary" onClick={() => context.startEditing()}>
          <Edit3 className={MOBILE_TAB_ICON_CLASS} strokeWidth={2.25} />
        </MobileActButton>
      ) : null}
    </>
  );
}
