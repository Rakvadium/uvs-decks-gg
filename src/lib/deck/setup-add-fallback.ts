"use client";

import { toast } from "sonner";
import type { DeckSetupSource } from "@shared/games/deck";
import type { ClientDeckSetupPatch, ClientGameModule } from "@/games/types";
import type { CachedCard } from "@/lib/universus/card-store";
import type { Id } from "../../../convex/_generated/dataModel";

interface OfferSetupAddParams {
  card: CachedCard | null | undefined;
  module: Pick<ClientGameModule, "deck" | "ui">;
  deck: DeckSetupSource<Id<"cards">> | null | undefined;
  getCard: (id: string) => CachedCard | null | undefined;
  applySetup: (patch: ClientDeckSetupPatch) => unknown;
}

/**
 * When a card can't go in the main deck because it belongs in the deck setup (Cyberpunk Legends),
 * explain that and offer "Add as Legend" instead of silently ignoring the add.
 * Returns `true` when a message was shown.
 */
export function offerSetupAdd({ card, module, deck, getCard, applySetup }: OfferSetupAddParams): boolean {
  if (!card || module.deck.isMainDeckEligible(card)) return false;
  const resolution = module.ui.deckSetup.resolveSetupAdd(card, module.deck.normalizeSetup(deck), getCard);
  if (!resolution) return false;

  if (resolution.kind === "blocked") {
    toast.info(resolution.message);
    return true;
  }

  toast.info(resolution.message, {
    action: {
      label: resolution.actionLabel,
      onClick: () => {
        void applySetup(resolution.patch);
      },
    },
  });
  return true;
}
