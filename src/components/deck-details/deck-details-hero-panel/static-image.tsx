"use client";

import Image from "next/image";
import { Hexagon, Layers } from "lucide-react";
import { useDeckDetailsHeroPanelContext } from "./context";

export function DeckDetailsHeroStaticImage() {
  const { deck, imageCard, startingCharacter, handleImageClick } = useDeckDetailsHeroPanelContext();
  const displayImage = imageCard?.imageUrl || startingCharacter?.imageUrl;

  return (
    <button
      type="button"
      aria-label="View starting character details"
      className="absolute inset-0 z-10 cursor-pointer overflow-hidden"
      onClick={handleImageClick}
    >
      {displayImage ? (
        <>
          <Image
            src={displayImage}
            alt={deck?.name ?? "Character"}
            fill
            sizes="(max-width: 1023px) 260px, 192px"
            className="object-cover object-top"
            priority
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Hexagon className="h-20 w-20 text-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="h-8 w-8 text-primary/40" />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
