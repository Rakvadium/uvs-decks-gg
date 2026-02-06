import type React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGenericCardContext } from "./context";

type InlineVariantProps = React.ComponentProps<"div">;

export function InlineVariant({ className, ...props }: InlineVariantProps) {
  const { cardData, deckCount } = useGenericCardContext();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
        className
      )}
      {...props}
    >
      <Image
        src={cardData.imageSrc}
        alt={cardData.name}
        width={24}
        height={24}
        className="h-6 w-6 rounded object-cover"
      />
      <span className="max-w-32 truncate">{cardData.name}</span>
      <Badge variant="secondary" className="ml-1">
        {deckCount}
      </Badge>
    </div>
  );
}
