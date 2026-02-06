import { useCallback, useState } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { useGenericCardContext } from "./context";
import { CardArt } from "./card-art";
import { GenericCardDetailsDialog } from "./details-dialog";
import type { CardData } from "./types";

interface CardVariantProps extends React.ComponentProps<"div"> {
  onCardClick?: (cardData: CardData) => void;
}

export function CardVariant({ className, onCardClick, ...props }: CardVariantProps) {
  const [showModal, setShowModal] = useState(false);
  const { cardData } = useGenericCardContext();

  const handleCardClick = useCallback(() => {
    onCardClick?.(cardData);
    setShowModal(true);
  }, [cardData, onCardClick]);

  return (
    <>
      <CardArt
        className={cn("group relative cursor-pointer", className)}
        onCardClick={handleCardClick}
        {...props}
      />
      <GenericCardDetailsDialog open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
