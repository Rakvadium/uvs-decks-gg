"use client";

import type { ComponentType } from "react";
import { useCardNavigation } from "@/components/card/navigation-context";
import type { GameCardDetailsDialogProps } from "@/games/types";
import { CardGridItemProvider, useCardGridItemContext } from "./context";
import { CardGridItemFrame } from "./frame";
import { CardGridItemImageStage, type CardGridItemFaceProps } from "./image-stage";
import type { CardGridItemProps } from "./types";

export type { CardGridItemFaceProps } from "./image-stage";

export interface CardGridItemShellProps extends CardGridItemProps {
  /** The game's card face renderer (image, or a fallback frame when there is no image). */
  FaceImage: ComponentType<CardGridItemFaceProps>;
  /** The game's card details dialog (embedded when the caller doesn't handle `onOpenCardDetails`). */
  DetailsDialog: ComponentType<GameCardDetailsDialogProps>;
}

function CardGridItemShellContent({
  embedDetailsDialog,
  FaceImage,
  DetailsDialog,
}: {
  embedDetailsDialog: boolean;
  FaceImage: CardGridItemShellProps["FaceImage"];
  DetailsDialog: CardGridItemShellProps["DetailsDialog"];
}) {
  const { card, backCard, isDialogOpen, setIsDialogOpen } = useCardGridItemContext();
  const nav = useCardNavigation();

  return (
    <>
      <CardGridItemFrame>
        <CardGridItemImageStage FaceImage={FaceImage} />
      </CardGridItemFrame>

      {embedDetailsDialog ? (
        <DetailsDialog
          card={card}
          backCard={backCard}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          cards={nav?.cards}
          getBackCard={nav?.getBackCard}
        />
      ) : null}
    </>
  );
}

/**
 * Game-agnostic gallery/deck grid tile: frame, hover glow, flip, drag, deck +/- controls.
 * Each game's `ui.CardGridItem` renders it with its own face renderer and details dialog.
 */
export function CardGridItemShell({ FaceImage, DetailsDialog, ...props }: CardGridItemShellProps) {
  const embedDetailsDialog = !props.onOpenCardDetails;
  return (
    <CardGridItemProvider {...props}>
      <CardGridItemShellContent
        embedDetailsDialog={embedDetailsDialog}
        FaceImage={FaceImage}
        DetailsDialog={DetailsDialog}
      />
    </CardGridItemProvider>
  );
}
