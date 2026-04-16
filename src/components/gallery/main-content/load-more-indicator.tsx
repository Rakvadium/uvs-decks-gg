import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Kicker } from "@/components/ui/typography-headings";

interface LoadMoreIndicatorProps {
  loadMoreRef: RefObject<HTMLDivElement | null>;
}

export function LoadMoreIndicator({ loadMoreRef }: LoadMoreIndicatorProps) {
  return (
    <div ref={loadMoreRef} className="flex justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20" />
        </div>
        <Kicker className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading more cards</Kicker>
      </div>
    </div>
  );
}
