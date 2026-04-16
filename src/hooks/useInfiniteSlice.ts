"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseInfiniteSliceOptions<T> {
  items: T[];
  pageSize: number;
  resetKey?: string;
  rootMargin?: string;
  rootRef?: RefObject<Element | null>;
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
  rootRef,
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

  const loadMoreCallbackRef = useRef(loadMore);
  loadMoreCallbackRef.current = loadMore;

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let rafId = 0;

    const tryAttach = () => {
      if (cancelled) return;
      const el = loadMoreRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }
      if (rootRef && !rootRef.current) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }
      const root = rootRef?.current ?? undefined;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMoreCallbackRef.current();
          }
        },
        { root: root ?? undefined, rootMargin }
      );
      observer.observe(el);
    };

    tryAttach();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [rootMargin, rootRef, signature, items.length]);

  const visibleItems = useMemo(() => items.slice(0, clampedVisibleCount), [items, clampedVisibleCount]);

  return {
    visibleItems,
    visibleCount: clampedVisibleCount,
    hasMore,
    loadMore,
    loadMoreRef,
  };
}
