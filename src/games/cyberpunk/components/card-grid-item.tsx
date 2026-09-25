"use client";

import { CardGridItemShell } from "@/components/card/grid-item/shell";
import type { GameCardGridItemProps } from "@/games/types";
import { CardImageDisplay } from "./card-image-display";
import { CardDetailsDialog } from "./card-details/dialog";

/** Gallery/deck grid tile: shared frame + deck controls, Cyberpunk face (text frame fallback). */
export function CardGridItem(props: GameCardGridItemProps) {
  return <CardGridItemShell {...props} FaceImage={CardImageDisplay} DetailsDialog={CardDetailsDialog} />;
}
