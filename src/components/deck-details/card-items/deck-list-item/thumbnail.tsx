import Image from "next/image";
import { Hexagon } from "lucide-react";
import { useDeckListItemContext } from "./context";

export function DeckListItemThumbnail() {
  const {
    card: { imageUrl, name },
  } = useDeckListItemContext();

  return (
    <div className="relative w-10 shrink-0 self-stretch overflow-hidden border-r border-border/40 bg-muted/50 md:h-10 md:w-7 md:self-auto md:rounded-md md:border md:border-border/30">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 767px) 40px, 28px"
          className="object-cover object-top"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
