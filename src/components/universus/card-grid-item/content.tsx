"use client";

import { CardDetailsDialog } from "../card-details-dialog";
import { useCardNavigation } from "../card-details/navigation-context";
import { CardGridItemProvider, useCardGridItemContext } from "./context";
import { CardGridItemFrame } from "./frame";
import { CardGridItemImageStage } from "./image-stage";
import type { CardGridItemProps } from "./types";

function CardGridItemContent({ embedDetailsDialog }: { embedDetailsDialog: boolean }) {
  const { card, backCard, isDialogOpen, setIsDialogOpen } = useCardGridItemContext();
  const nav = useCardNavigation();

  return (
    <>
      <CardGridItemFrame>
        <CardGridItemImageStage />
      </CardGridItemFrame>

      {embedDetailsDialog ? (
        <CardDetailsDialog
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

export function CardGridItem(props: CardGridItemProps) {
  const embedDetailsDialog = !props.onOpenCardDetails;
  return (
    <CardGridItemProvider {...props}>
      <CardGridItemContent embedDetailsDialog={embedDetailsDialog} />
    </CardGridItemProvider>
  );
}
