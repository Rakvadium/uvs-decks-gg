"use client";

import Image from "next/image";
import type { GameCardImageDisplayProps } from "@/games/types";
import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import { CyberpunkCardTextFrame } from "./card-text-frame";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 40vw, (max-width: 1024px) 33vw, (max-width: 1280px) 28vw, 24vw";

export interface CyberpunkCardImageDisplayProps extends GameCardImageDisplayProps {
  /** Card data for the text-frame fallback (name only when omitted). */
  card?: CachedCard | null;
}

/** Card image, or a text frame (name, type, cost / power / RAM, color stripe) when there is none. */
export function CardImageDisplay({
  imageUrl,
  name,
  card,
  className,
  imgRef,
  priority,
  sizes,
  quality = 95,
  fetchPriority,
}: CyberpunkCardImageDisplayProps) {
  if (!imageUrl || !isValidUrl(imageUrl)) {
    return <CyberpunkCardTextFrame card={card} name={name} className={className} />;
  }

  return (
    <Image
      ref={imgRef}
      src={imageUrl}
      alt={name}
      fill
      sizes={sizes ?? DEFAULT_SIZES}
      quality={quality}
      className={cn("h-full w-full object-cover", className)}
      priority={priority ?? false}
      loading={priority ? undefined : "lazy"}
      fetchPriority={fetchPriority}
      draggable={false}
      decoding="async"
    />
  );
}
