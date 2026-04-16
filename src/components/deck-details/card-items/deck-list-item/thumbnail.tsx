import Image from "next/image";
import { Hexagon } from "lucide-react";
import { useDeckListItemContext } from "./context";

export function DeckListItemThumbnail() {
  const {
    card: { imageUrl, name },
  } = useDeckListItemContext();

  return (
    <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-md border border-border/30 bg-muted/30">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="28px"
          className="object-cover object-top"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-3.5 w-3.5 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
