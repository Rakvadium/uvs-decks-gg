import Image from "next/image";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

interface CardImageDisplayProps {
  imageUrl?: string;
  name: string;
  className?: string;
  imgRef?: RefObject<HTMLImageElement | null>;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fetchPriority?: "auto" | "high" | "low";
}

export function CardImageDisplay({
  imageUrl,
  name,
  className,
  imgRef,
  priority,
  sizes,
  quality = 95,
  fetchPriority,
}: CardImageDisplayProps) {
  const hasValidImageUrl = Boolean(imageUrl && isValidUrl(imageUrl));

  if (!hasValidImageUrl) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center border border-border/50 bg-muted/50", className)}>
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded border border-primary/30">
            <span className="text-lg text-primary/50">?</span>
          </div>
          <span className="chrome-label-case text-xs text-muted-foreground">No Image</span>
        </div>
      </div>
    );
  }

  const defaultSizes =
    "(max-width: 640px) 50vw, (max-width: 768px) 40vw, (max-width: 1024px) 33vw, (max-width: 1280px) 28vw, 24vw";

  return (
    <Image
      ref={imgRef}
      src={imageUrl as string}
      alt={name}
      fill
      sizes={sizes ?? defaultSizes}
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
