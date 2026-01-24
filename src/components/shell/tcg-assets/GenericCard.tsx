import * as React from "react"
import { RotateCcw, Plus, Minus, Eye } from "lucide-react"

import { cn } from "@/lib/utils"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type CardVariant = "card" | "list" | "inline";

interface CardData {
  id: string;
  name: string;
  imageSrc: string;
  type: string;
  rarity: string;
  description: string;
  attack?: number;
  defense?: number;
  cost?: number;
}

type CardDetailsRendererProps = {
  cardData: CardData
  deckCount: number
  onAddToDeck?: (cardId: string) => void
  onRemoveFromDeck?: (cardId: string) => void
}

const DefaultDetails = ({ cardData, deckCount, onAddToDeck, onRemoveFromDeck }: CardDetailsRendererProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Type:</span>
            <span>{cardData.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Rarity:</span>
            <span>{cardData.rarity}</span>
          </div>
          {cardData.attack && (
            <div className="flex justify-between">
              <span className="font-medium">Attack:</span>
              <span>{cardData.attack}</span>
            </div>
          )}
          {cardData.defense && (
            <div className="flex justify-between">
              <span className="font-medium">Defense:</span>
              <span>{cardData.defense}</span>
            </div>
          )}
          {cardData.cost && (
            <div className="flex justify-between">
              <span className="font-medium">Cost:</span>
              <span>{cardData.cost}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Description</h4>
        <p className="text-sm text-muted-foreground">{cardData.description}</p>
      </div>

      <div className="flex justify-between">
        <span className="font-medium">In Deck:</span>
        <Badge>{deckCount}</Badge>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => onRemoveFromDeck?.(cardData.id)}
          disabled={deckCount === 0}
          variant="outline"
          className="flex-1"
        >
          <Minus className="h-4 w-4 mr-2" />
          Remove
        </Button>
        <Button
          onClick={() => onAddToDeck?.(cardData.id)}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  )
}

function GenericCard({
  className,
  variant = "card",
  cardData,
  deckCount = 0,
  onAddToDeck,
  onRemoveFromDeck,
  onCardClick,
  showFlipButton = false,
  onFlip,
  renderDetails,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: CardVariant;
  cardData: CardData;
  deckCount?: number;
  onAddToDeck?: (cardId: string) => void;
  onRemoveFromDeck?: (cardId: string) => void;
  onCardClick?: (cardData: CardData) => void;
  showFlipButton?: boolean;
  onFlip?: () => void;
  renderDetails?: (props: CardDetailsRendererProps) => React.ReactNode;
}) {
  const [showModal, setShowModal] = React.useState(false);

  const handleCardClick = () => {
    if (variant !== "card") return;
    if (onCardClick) onCardClick(cardData);
    setShowModal(true);
  };

  if (variant === "list") {
    return (
      <div className={cn("flex items-center gap-4 py-4 pl-4 pr-4 border rounded-lg hover:bg-accent/50 transition-colors relative group", className)}>
        {/* Hover Image - positioned to the left */}
        <div className="absolute -left-52 top-1/2 -translate-y-1/2 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <AspectRatio ratio={744 / 1039} className="w-full">
            <img
              src={cardData.imageSrc}
              alt={cardData.name}
              className="w-full h-full object-cover rounded-lg shadow-lg border"
            />
          </AspectRatio>
        </div>

        {/* Thumbnail */}
        <div className="w-16 flex-shrink-0 absolute left-0 top-0 bottom-0 overflow-hidden rounded-l-xl">
          <img
            src={cardData.imageSrc}
            alt={cardData.name}
            className="w-16 h-full object-cover"
          />
        </div>
        <div className="ml-20 flex-1 min-w-0">
          <h3 className="font-semibold truncate">{cardData.name}</h3>
          <p className="text-sm text-muted-foreground">{cardData.type} • {cardData.rarity}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{deckCount}</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemoveFromDeck?.(cardData.id)}
            disabled={deckCount === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddToDeck?.(cardData.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1 border rounded-full text-sm", className)}>
        <img
          src={cardData.imageSrc}
          alt={cardData.name}
          className="w-6 h-6 rounded object-cover"
        />
        <span className="truncate max-w-32">{cardData.name}</span>
        <Badge variant="secondary" className="ml-1">{deckCount}</Badge>
      </div>
    );
  }

  // Default card variant
  return (
    <>
      <div
        data-slot="card"
        className={cn(
          "relative group cursor-pointer",
          className
        )}
        onClick={handleCardClick}
        {...props}
      >
        <AspectRatio ratio={744 / 1039} className="w-full overflow-hidden rounded-xl border shadow-sm">
          <img
            src={cardData.imageSrc}
            alt={cardData.name}
            className="absolute inset-0 h-full w-full object-cover block"
          />

          {/* Deck Count Badge */}
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-primary/90 backdrop-blur-sm border-primary/50">
              {deckCount}
            </Badge>
          </div>

          {/* Deck Management Buttons */}
          <div className="absolute bottom-2 left-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromDeck?.(cardData.id);
                    }}
                    disabled={deckCount === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove from deck</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToDeck?.(cardData.id);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to deck</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Flip Button */}
          {showFlipButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardFlipButton
                    onClick={(e) => {
                      e?.stopPropagation();
                      onFlip?.();
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Back</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </AspectRatio>
      </div>

      {/* Card Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="md:min-w-[65vw] md:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{cardData.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto">
            {/* Left side - Card Image */}
            <div className="flex justify-center">
              <GenericCard
                variant="card"
                cardData={cardData}
                deckCount={deckCount}
                onAddToDeck={onAddToDeck}
                onRemoveFromDeck={onRemoveFromDeck}
                showFlipButton={showFlipButton}
                onFlip={onFlip}
                className="w-64"
              />
            </div>

            <div className="space-y-4">
              {renderDetails ? (
                renderDetails({ cardData, deckCount, onAddToDeck, onRemoveFromDeck })
              ) : (
                <DefaultDetails
                  cardData={cardData}
                  deckCount={deckCount}
                  onAddToDeck={onAddToDeck}
                  onRemoveFromDeck={onRemoveFromDeck}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "absolute top-4 left-4 right-4 z-10",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-white text-lg font-bold drop-shadow-lg", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-white/90 text-sm drop-shadow-md", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "absolute top-4 right-4 z-20",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("absolute inset-0 flex items-center justify-center z-10", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("absolute bottom-4 left-4 right-4 z-10", className)}
      {...props}
    />
  )
}

function CardOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-overlay"
      className={cn("absolute inset-0 z-5", className)}
      {...props}
    />
  )
}

function CardFlipButton({ className, onFlip, ...props }: React.ComponentProps<typeof Button> & {
  onFlip?: () => void
}) {
  return (
    <Button
      data-slot="card-flip-button"
      size="icon"
      variant="default"
      className={cn(
        "absolute top-0 left-0 z-20 h-7 w-7 bg-primary/60 backdrop-blur-sm border-primary/80 text-white hover:bg-primary/80 border rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        className
      )}
      onClick={(e) => {
        onFlip?.();
        props.onClick?.(e);
      }}
      {...props}
    >
      <RotateCcw className="h-3 w-3" />
      <span className="sr-only">Flip card</span>
    </Button>
  )
}

export {
  GenericCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardOverlay,
  CardFlipButton,
}

export type { CardVariant, CardData, CardDetailsRendererProps }
