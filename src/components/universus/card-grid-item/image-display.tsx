import Image from "next/image";
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
}

export function CardImageDisplay({ imageUrl, name, className }: CardImageDisplayProps) {
  const hasValidImageUrl = Boolean(imageUrl && isValidUrl(imageUrl));

  if (!hasValidImageUrl) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center border border-border/50 bg-muted/50", className)}>
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded border border-primary/30">
            <span className="text-lg text-primary/50">?</span>
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl as string}
      alt={name}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
      className={cn("object-cover", className)}
      loading="lazy"
      draggable={false}
    />
  );
}
