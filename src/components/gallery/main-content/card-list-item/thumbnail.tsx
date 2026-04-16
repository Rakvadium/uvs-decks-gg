import Image from "next/image";
import { Hexagon } from "lucide-react";
import { useCardListItemContext } from "./context";

export function CardListItemThumbnail() {
  const {
    card: { imageUrl, name },
    dragPreviewImageRef,
    thumbnailPriority,
  } = useCardListItemContext();

  return (
    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted/40">
      {imageUrl ? (
        <Image
          ref={dragPreviewImageRef}
          src={imageUrl}
          alt={name}
          fill
          sizes="48px"
          className="object-cover object-top"
          priority={thumbnailPriority}
          loading={thumbnailPriority ? undefined : "lazy"}
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
