"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

export function useMobileBottomOverlayClearance(elementRef: RefObject<HTMLElement | null>) {
  const [clearancePx, setClearancePx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      const next = element.getBoundingClientRect().height;
      setClearancePx(Number.isFinite(next) ? Math.ceil(next) : null);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [elementRef]);

  return clearancePx;
}
