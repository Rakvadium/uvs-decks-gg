"use client";

import { Button } from "@/components/ui/button";
import { useGameModule } from "@/games/game-context";
import { SimulatorHandImageCard } from "./hand-image-card";
import { useDrawnHand } from "./use-drawn-hand";
import { useSimulatorDeckState } from "./use-simulator-deck-state";

export function HandSimulatorSidebar() {
  const { simulatorSetupHint, simulatorNoHandSizeHint } = useGameModule().ui.deckSetup;
  const { cardMap, startingCharacter, handSize, mainDeckPool, canDraw } = useSimulatorDeckState();
  const { drawnCards, drawHand } = useDrawnHand({
    canDraw,
    handSize,
    mainDeckPool,
    cardMap,
  });

  return (
    <div className="flex h-full flex-col space-y-3 p-4">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {simulatorSetupHint && !startingCharacter ? (
          <div className="rounded-lg border border-dashed border-border/50 p-4 text-xs text-muted-foreground">
            {simulatorSetupHint}
          </div>
        ) : null}

        {simulatorNoHandSizeHint && startingCharacter && handSize <= 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 p-4 text-xs text-muted-foreground">
            {simulatorNoHandSizeHint}
          </div>
        ) : null}

        {drawnCards.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-dashed border-border/50 p-4">
            <p className="text-xs text-muted-foreground">Draw your opening hand from the full Main deck.</p>
            <Button variant="outline" size="sm" className="w-full" onClick={drawHand} disabled={!canDraw}>
              Draw First Hand
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {drawnCards.map(({ key, card }) => (
              <SimulatorHandImageCard key={key} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
