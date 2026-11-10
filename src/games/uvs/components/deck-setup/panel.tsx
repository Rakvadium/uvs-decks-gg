"use client";

import { uvsSetupFields } from "@shared/games/uvs/setup";
import type { GameDeckSetupPanelProps, GameSetupCardPickerDialogProps } from "@/games/types";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { DeckCharacterPickerDialog } from "../character-picker-dialog";
import { UvsDeckSetupHero } from "./hero";
import { UvsDeckSetupSidebar } from "./sidebar";

/**
 * UVS deck setup panel (starting character + identity). `compact` renders nothing: UVS deck tiles
 * already show the character art and identity symbol.
 */
export function UvsDeckSetupPanel(props: GameDeckSetupPanelProps) {
  if (props.variant === "hero") return <UvsDeckSetupHero {...props} />;
  if (props.variant === "sidebar") return <UvsDeckSetupSidebar {...props} />;
  return null;
}

/** Contract adapter for the starting character picker. */
export function UvsSetupCardPickerDialog({ open, onOpenChange, setup, onChange }: GameSetupCardPickerDialogProps) {
  return (
    <DeckCharacterPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      selectedCharacterId={uvsSetupFields(setup).startingCharacterId}
      onSelectCharacter={(cardId: Id<"cards">) => onChange({ game: "uvs", startingCharacterId: cardId })}
    />
  );
}
