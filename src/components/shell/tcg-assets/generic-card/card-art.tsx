import type React from "react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CardActionsOverlay } from "./card-actions-overlay";
import { CardFlipButton } from "./card-flip-button";
import { useGenericCardContext } from "./context";

interface CardArtProps extends React.ComponentProps<"div"> {
  onCardClick?: () => void;
  clickable?: boolean;
}

export function CardArt({
  className,
  onCardClick,
  clickable = true,
  ...props
}: CardArtProps) {
  const {
    cardData,
    deckCount,
    onAddToDeck,
    onRemoveFromDeck,
    onFlip,
    showFlipButton,
  } = useGenericCardContext();

  return (
    <div
      data-slot="card"
      className={className}
      onClick={clickable ? onCardClick : undefined}
      {...props}
    >
      <AspectRatio
        ratio={744 / 1039}
        className="w-full overflow-hidden rounded-xl border shadow-sm"
      >
        <Image
          src={cardData.imageSrc}
          alt={cardData.name}
          fill
          className="absolute inset-0 block h-full w-full object-cover"
        />

        <div className="absolute right-2 top-2 z-10">
          <Badge className="border-primary/50 bg-primary/90 backdrop-blur-sm">
            {deckCount}
          </Badge>
        </div>

        <CardActionsOverlay
          cardId={cardData.id}
          deckCount={deckCount}
          onAddToDeck={onAddToDeck}
          onRemoveFromDeck={onRemoveFromDeck}
        />

        {showFlipButton ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <CardFlipButton
                onClick={(event) => {
                  event.stopPropagation();
                  onFlip?.();
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>View Back</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </AspectRatio>
    </div>
  );
}
