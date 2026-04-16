import Image from "next/image";
import { Hexagon } from "lucide-react";
import type { CachedCard } from "@/lib/universus/card-store";

export function SimulatorHandImageCard({ card }: { card: CachedCard }) {
  return (
    <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg border border-border/50 bg-muted/30">
      {card.imageUrl ? (
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          sizes="(max-width: 640px) 42vw, 160px"
          className="object-cover object-top"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Hexagon className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
