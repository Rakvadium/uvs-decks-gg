import Image from "next/image";
import { Hexagon } from "lucide-react";
import { useActiveDeckCardRowContext } from "./context";

export function ActiveDeckCardRowThumbnail() {
  const {
    card: { imageUrl, name },
  } = useActiveDeckCardRowContext();

  return (
    <div className="relative h-8 w-6 overflow-hidden rounded border border-border/40 bg-muted/40">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover object-top" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
