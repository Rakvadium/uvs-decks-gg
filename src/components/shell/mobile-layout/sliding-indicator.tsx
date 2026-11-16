"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MORPH_EASE, prefersReducedMotion } from "./morph";

const SLIDE = `transform 420ms ${MORPH_EASE}, width 420ms ${MORPH_EASE}, height 420ms ${MORPH_EASE}, opacity 200ms ease`;

/**
 * A selection pill that slides to the active item, like iOS tab bars. Mark the active item with
 * `data-indicator-active="true"` inside the returned container; the pill follows it whenever
 * `activeKey` changes (a route change, a tab switch). Styles are written straight to the element,
 * so moving it never re-renders the row.
 */
export function useSlidingIndicator(activeKey: string | null) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const placedRef = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const place = (animate: boolean) => {
      const active = container.querySelector<HTMLElement>('[data-indicator-active="true"]');
      if (!active) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.transition = animate && !prefersReducedMotion() ? SLIDE : "none";
      indicator.style.opacity = "1";
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    };

    // Slide on changes after the first placement; snap on first paint and on resize.
    place(placedRef.current);
    placedRef.current = true;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeKey]);

  return { containerRef, indicatorRef };
}

export function SlidingIndicator({
  indicatorRef,
  className,
}: {
  indicatorRef: React.RefObject<HTMLSpanElement | null>;
  className?: string;
}) {
  return (
    <span
      ref={indicatorRef}
      aria-hidden
      className={cn("pointer-events-none absolute left-0 top-0 opacity-0", className)}
    />
  );
}
