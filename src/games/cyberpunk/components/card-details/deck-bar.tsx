"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameModule } from "@/games/game-context";
import { useDeckEditor } from "@/lib/deck";
import type { CachedCard } from "@/lib/universus/card-store";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";

/**
 * Card details deck controls: main-deck -/count/+ for deck cards (no sideboard in Cyberpunk);
 * setup cards (Legends) get the module's `CardSetupAction` instead.
 */
export function CyberpunkCardDeckBar({ card }: { card: CachedCard }) {
  const { deck: deckRules, ui } = useGameModule();
  const { CardSetupAction } = ui;
  const { hasDeck, addCard, removeCard, mainCounts, sideCounts } = useDeckEditor();
  const deckDetails = useDeckDetailsOptional();
  const canEdit = (deckDetails?.isOwner ?? true) && hasDeck;

  if (!canEdit) return null;

  if (!deckRules.isMainDeckEligible(card)) {
    return (
      <div className="flex items-center gap-2">
        <CardSetupAction card={card} />
      </div>
    );
  }

  const count = mainCounts[card._id] ?? 0;
  const mainSide = count + (sideCounts[card._id] ?? 0);
  const limit = deckRules.getCardCopyLimit(card);
  const canAdd = mainSide + 1 <= limit;

  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border border-primary/40 bg-card/95 pl-3 pr-1 backdrop-blur-sm">
      <span className="chrome-label-case text-xs font-semibold text-muted-foreground">Deck</span>
      <span aria-hidden className="h-5 w-px bg-border/40" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => removeCard(card._id, "main")}
        disabled={count === 0}
        aria-label={`Remove ${card.name} from deck`}
        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums text-primary" aria-live="polite">
        {count}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => addCard(card._id, "main")}
        disabled={!canAdd}
        aria-label={`Add ${card.name} to deck`}
        className="h-7 w-7 text-primary hover:bg-primary/10 hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      {Number.isFinite(limit) ? (
        <span className="pr-2 text-[11px] tabular-nums text-muted-foreground">max {limit}</span>
      ) : null}
    </div>
  );
}
