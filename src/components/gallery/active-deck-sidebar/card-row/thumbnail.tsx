import Image from "next/image";
import { Hexagon } from "lucide-react";
import { useActiveDeckCardRowContext } from "./context";

export function ActiveDeckCardRowThumbnail() {
  const {
    card: { imageUrl, name },
    dragPreviewImageRef,
  } = useActiveDeckCardRowContext();

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
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
