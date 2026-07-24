"use client";

import { CARD_GLOW_REST, CARD_GLOW_HOVER } from "@/components/universus/card-item/glow";
import { cn } from "@/lib/utils";
import { useCardGridItemContext } from "./context";
import { CardImageDisplay } from "./image-display";

export function CardGridItemImageStage() {
  const {
    card,
    backCard,
    dragPreviewImageRef,
    imagePriority,
    imageSizes,
    imageQuality,
    isFlipped,
    isHovered,
    isDragging,
    prefersReducedMotion,
  } = useCardGridItemContext();

  const hasBackFace = Boolean(backCard);
  const transitionClass =
    prefersReducedMotion || isDragging ? "duration-0" : "duration-200 ease-out";

  return (
    <div
      className="relative z-[1] h-full w-full overflow-hidden rounded-xl transition-shadow duration-150"
      style={{ boxShadow: isDragging ? CARD_GLOW_REST : isHovered ? CARD_GLOW_HOVER : CARD_GLOW_REST }}
    >
      {!hasBackFace ? (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <CardImageDisplay
            imageUrl={card.imageUrl}
            name={card.name}
            imgRef={dragPreviewImageRef}
            priority={imagePriority}
            sizes={imageSizes}
            quality={imageQuality}
          />
        </div>
      ) : (
        <>
          <div
            className={cn(
              "absolute inset-0 overflow-hidden rounded-xl transition-opacity",
              transitionClass,
              isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
            )}
          >
            <CardImageDisplay
              imageUrl={card.imageUrl}
              name={card.name}
              imgRef={!isFlipped ? dragPreviewImageRef : undefined}
              priority={imagePriority && !isFlipped}
              sizes={imageSizes}
              quality={imageQuality}
              fetchPriority={isFlipped ? "low" : undefined}
            />
          </div>
          <div
            className={cn(
              "absolute inset-0 overflow-hidden rounded-xl transition-opacity",
              transitionClass,
              !isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
            )}
          >
            <CardImageDisplay
              imageUrl={backCard!.imageUrl}
              name={backCard!.name}
              imgRef={isFlipped ? dragPreviewImageRef : undefined}
              priority={imagePriority && isFlipped}
              sizes={imageSizes}
              quality={imageQuality}
              fetchPriority={!isFlipped ? "low" : undefined}
            />
          </div>
        </>
      )}

      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-150"
        style={{ opacity: !isDragging && isHovered ? 0.25 : 0 }}
      />

      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,transparent_40%,var(--primary)/10_50%,transparent_60%)] transition-opacity duration-150"
        style={{
          backgroundSize: "200% 200%",
          opacity: !isDragging && isHovered ? 1 : 0,
          animation:
            !isDragging && isHovered && !prefersReducedMotion ? "holo-shimmer 3s ease-in-out infinite" : "none",
        }}
      />
    </div>
  );
}
