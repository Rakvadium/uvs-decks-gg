"use client";

import { CardGridItemShell } from "@/components/card/grid-item/shell";
import type { CardGridItemProps } from "@/components/card/grid-item/types";
import { CardDetailsDialog } from "../card-details-dialog";
import { CardImageDisplay } from "./image-display";

export function CardGridItem(props: CardGridItemProps) {
  return <CardGridItemShell {...props} FaceImage={CardImageDisplay} DetailsDialog={CardDetailsDialog} />;
}
