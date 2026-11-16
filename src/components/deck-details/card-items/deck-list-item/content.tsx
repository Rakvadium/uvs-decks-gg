"use client";

import { DeckCardRow } from "../deck-details-list-card-row/content";
import { useDeckDetailsListCardRowModel } from "../deck-details-list-card-row/hook";
import type { DeckListItemProps } from "./types";

export function DeckListItem({ entry }: DeckListItemProps) {
  return <DeckCardRow model={useDeckDetailsListCardRowModel({ entry })} />;
}
