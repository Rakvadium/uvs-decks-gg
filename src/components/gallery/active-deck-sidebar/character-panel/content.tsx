"use client";

import { useGameModule } from "@/games/game-context";
import { useActiveDeckCharacterPanelModel } from "./hook";

/** Active deck setup (UVS: starting character; Cyberpunk: Legends), rendered by the game module. */
export function ActiveDeckCharacterPanel() {
  const { DeckSetupPanel } = useGameModule().ui;
  const { activeDeck, setup, getCard, onChange } = useActiveDeckCharacterPanelModel();

  return (
    <DeckSetupPanel
      variant="sidebar"
      setup={setup}
      getCard={getCard}
      onChange={onChange}
      mainQuantities={activeDeck?.mainQuantities}
      deckName={activeDeck?.name}
      deckDescription={activeDeck?.description}
    />
  );
}
