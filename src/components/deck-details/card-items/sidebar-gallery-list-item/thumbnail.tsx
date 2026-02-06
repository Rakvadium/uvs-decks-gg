import Image from "next/image";
import { Hexagon } from "lucide-react";
import { useSidebarGalleryListItemContext } from "./context";

export function SidebarGalleryListItemThumbnail() {
  const {
    card: { imageUrl, name },
  } = useSidebarGalleryListItemContext();

  return (
    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded border border-border/40 bg-muted/30">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover object-top" draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-3.5 w-3.5 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
