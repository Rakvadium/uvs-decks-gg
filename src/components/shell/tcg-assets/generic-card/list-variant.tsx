import type React from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGenericCardContext } from "./context";

type ListVariantProps = React.ComponentProps<"div">;

export function ListVariant({ className, ...props }: ListVariantProps) {
  const { cardData, deckCount, onAddToDeck, onRemoveFromDeck } = useGenericCardContext();

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-lg border py-4 pl-4 pr-4 transition-colors hover:bg-accent/50",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute -left-52 top-1/2 z-50 w-48 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <AspectRatio ratio={744 / 1039} className="w-full">
          <Image
            src={cardData.imageSrc}
            alt={cardData.name}
            fill
            className="h-full w-full rounded-lg border object-cover shadow-lg"
          />
        </AspectRatio>
      </div>

      <div className="absolute bottom-0 left-0 top-0 w-16 flex-shrink-0 overflow-hidden rounded-l-xl relative">
        <Image src={cardData.imageSrc} alt={cardData.name} fill className="h-full w-16 object-cover" />
      </div>

      <div className="ml-20 min-w-0 flex-1">
        <h3 className="truncate font-semibold">{cardData.name}</h3>
        <p className="text-sm text-muted-foreground">
          {cardData.type} • {cardData.rarity}
        </p>
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
