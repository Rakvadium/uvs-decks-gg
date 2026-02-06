"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseInfiniteSliceOptions<T> {
  items: T[];
  pageSize: number;
  resetKey?: string;
  rootMargin?: string;
}

interface UseInfiniteSliceResult<T> {
  visibleItems: T[];
  visibleCount: number;
  hasMore: boolean;
  loadMore: () => void;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
}

export function useInfiniteSlice<T>({
  items,
  pageSize,
  resetKey,
  rootMargin = "200px",
}: UseInfiniteSliceOptions<T>): UseInfiniteSliceResult<T> {
  const signature = resetKey ?? "__default__";
  const [state, setState] = useState(() => ({ signature, count: pageSize }));
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const visibleCount = state.signature === signature ? state.count : pageSize;
  const clampedVisibleCount = Math.min(visibleCount, items.length);
  const hasMore = clampedVisibleCount < items.length;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setState((prev) => {
      const currentCount = prev.signature === signature ? prev.count : pageSize;
      return {
        signature,
        count: Math.min(currentCount + pageSize, items.length),
      };
    });
  }, [hasMore, items.length, pageSize, signature]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore, rootMargin]);

  const visibleItems = useMemo(() => items.slice(0, clampedVisibleCount), [items, clampedVisibleCount]);

  return {
    visibleItems,
    visibleCount: clampedVisibleCount,
    hasMore,
    loadMore,
    loadMoreRef,
  };
}
