"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { PageHeading } from "@/components/ui/typography-headings";
import { cn } from "@/lib/utils";
import { useMobileShellOptional } from "./mobile-shell-context";

interface MobileLargeTitleProps {
  children: ReactNode;
  className?: string;
  trailing?: ReactNode;
}

export function MobileLargeTitle({ children, className, trailing }: MobileLargeTitleProps) {
  const shell = useMobileShellOptional();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const setLargeTitleVisible = shell?.setLargeTitleVisible;

  useLayoutEffect(() => {
    const element = sentinelRef.current;
    if (!element || !setLargeTitleVisible) return;

    const rect = element.getBoundingClientRect();
    setLargeTitleVisible(rect.top >= 0 && rect.bottom <= window.innerHeight);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setLargeTitleVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.6 }
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      setLargeTitleVisible(false);
    };
  }, [setLargeTitleVisible]);

  return (
    <div ref={sentinelRef} className={cn("flex items-end justify-between gap-3 md:hidden", className)}>
      <PageHeading size="lg" className="min-w-0 truncate tracking-tight">
        {children}
      </PageHeading>
      {trailing ? <div className="shrink-0 pb-1">{trailing}</div> : null}
    </div>
  );
}
