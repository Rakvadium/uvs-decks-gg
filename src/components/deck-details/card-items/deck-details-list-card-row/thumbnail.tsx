import Image from "next/image";
import { Hexagon } from "lucide-react";
import { useDeckDetailsListCardRowContext } from "./context";

export function DeckDetailsListCardRowThumbnail() {
  const {
    card: { imageUrl, name },
    dragPreviewImageRef,
  } = useDeckDetailsListCardRowContext();

  return (
    <div className="relative w-10 shrink-0 self-stretch overflow-hidden border-r border-border/40 bg-muted/50">
      {imageUrl ? (
        <Image
          ref={dragPreviewImageRef}
          src={imageUrl}
          alt={name}
          fill
          sizes="40px"
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
