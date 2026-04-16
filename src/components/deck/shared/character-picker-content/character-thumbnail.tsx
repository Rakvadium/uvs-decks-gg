import Image from "next/image";
import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CharacterThumbnail({
  imageUrl,
  name,
  className,
}: {
  imageUrl?: string;
  name: string;
  className: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded border border-border/40 bg-muted/40", className)}>
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover object-top" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
