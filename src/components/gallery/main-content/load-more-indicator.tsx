import type { RefObject } from "react";

import { LoadingState } from "@/components/ui/loading-state";

interface LoadMoreIndicatorProps {
  loadMoreRef: RefObject<HTMLDivElement | null>;
}

export function LoadMoreIndicator({ loadMoreRef }: LoadMoreIndicatorProps) {
  return (
    <div ref={loadMoreRef}>
      <LoadingState size="lg" label="Loading more cards" />
    </div>
  );
}
