import type { RefObject } from "react";

import { Kicker } from "@/components/ui/typography-headings";
import { Spinner } from "@/components/ui/spinner";

interface LoadMoreIndicatorProps {
  loadMoreRef: RefObject<HTMLDivElement | null>;
}

export function LoadMoreIndicator({ loadMoreRef }: LoadMoreIndicatorProps) {
  return (
    <div ref={loadMoreRef} className="flex justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Spinner size="lg" className="text-primary" />
          <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20" />
        </div>
        <Kicker>Loading more cards</Kicker>
      </div>
    </div>
  );
}
