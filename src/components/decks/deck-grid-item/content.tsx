"use client";

import type { ReactElement } from "react";
import { DeckGridItemProvider } from "./context";
import {
  ACTIVE_DECK_CARD_DESIGN,
  type DeckCardDesign,
  type DeckGridItemProps,
} from "./types";
import { DeckNameplateItem } from "./variants/nameplate";
import { DeckSplashItem } from "./variants/splash";

const DESIGN_COMPONENTS: Record<DeckCardDesign, () => ReactElement> = {
  nameplate: DeckNameplateItem,
  splash: DeckSplashItem,
};

export function DeckGridItem({
  design = ACTIVE_DECK_CARD_DESIGN,
  ...props
}: DeckGridItemProps) {
  const Variant = DESIGN_COMPONENTS[design];

  return (
    <DeckGridItemProvider {...props}>
      <Variant />
    </DeckGridItemProvider>
  );
}
