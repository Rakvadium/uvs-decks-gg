"use client";

import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import { cyberpunkCardTitle, getCyberpunkColorHex } from "../../config";
import { CardImageDisplay } from "../card-image-display";

/** Legend card art (text frame when there is no image) in a card-shaped box. */
export function LegendArt({ card, sizes, className }: { card: CachedCard; sizes: string; className?: string }) {
  return (
    <span className={cn("relative block aspect-[2.5/3.5] overflow-hidden rounded-md bg-muted", className)}>
      <CardImageDisplay imageUrl={card.imageUrl} name={card.name} card={card} sizes={sizes} />
    </span>
  );
}

/** Round Legend avatar for tiles: art cropped to the face, or initials on the Legend's color. */
export function LegendAvatar({ card, className }: { card: CachedCard; className?: string }) {
  const hex = getCyberpunkColorHex(card.color);
  const { title } = cyberpunkCardTitle(card);
  return (
    <span
      title={title}
      className={cn("relative block size-7 shrink-0 overflow-hidden rounded-full bg-card", className)}
      style={{ boxShadow: `0 0 0 2px ${hex}` }}
    >
      {card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 28px avatar; next/image adds no value here
        <img src={card.imageUrl} alt={title} className="h-full w-full scale-150 object-cover object-top" loading="lazy" />
      ) : (
        <span
          aria-label={title}
          className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: `${hex}cc` }}
        >
          {title.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
