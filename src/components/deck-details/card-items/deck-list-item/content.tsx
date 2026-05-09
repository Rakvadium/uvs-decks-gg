"use client";

import { DeckDetailsListCardRow } from "../deck-details-list-card-row/content";
import type { DeckListItemProps } from "./types";

export function DeckListItem({ entry }: DeckListItemProps) {
  return <DeckDetailsListCardRow entry={entry} />;
}
