"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const floatingIslandRingClassName =
  "bg-[linear-gradient(115deg,color-mix(in_oklch,var(--primary)_40%,transparent),color-mix(in_oklch,var(--border)_65%,transparent)_28%,color-mix(in_oklch,var(--border)_65%,transparent)_72%,color-mix(in_oklch,var(--secondary)_40%,transparent))]";

interface FloatingIslandCapsuleProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  glow?: boolean;
}

export function FloatingIslandCapsule({
  children,
  className,
  bodyClassName,
  glow = true,
}: FloatingIslandCapsuleProps) {
  return (
    <div className={cn("relative", className)}>
      {glow ? (
        <div
          className="pointer-events-none absolute inset-x-12 top-full h-4 -translate-y-1.5 rounded-[100%] bg-primary/6 blur-lg dark:bg-primary/12"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "relative rounded-full p-px shadow-[var(--chrome-floating-shadow)] transition-shadow duration-300",
          floatingIslandRingClassName,
          "focus-within:shadow-[var(--chrome-floating-shadow-focus)]"
        )}
      >
        <div
          className={cn(
            "flex h-11 w-full min-w-0 items-center gap-1 rounded-full bg-background/80 pl-4 pr-2 backdrop-blur-xl",
            bodyClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface FloatingIslandProps {
  children: ReactNode;
  anchored?: ReactNode;
  below?: ReactNode;
  className?: string;
  capsuleClassName?: string;
  bodyClassName?: string;
}

export function FloatingIsland({
  children,
  anchored,
  below,
  className,
  capsuleClassName,
  bodyClassName,
}: FloatingIslandProps) {
  return (
    <div
      className={cn(
        "pointer-events-none relative flex w-full min-w-0 flex-col items-center gap-2 py-0.5",
        className
      )}
    >
      <FloatingIslandCapsule
        className={cn("pointer-events-auto w-full max-w-3xl", capsuleClassName)}
        bodyClassName={bodyClassName}
      >
        {children}
      </FloatingIslandCapsule>

      {below ? <div className="pointer-events-auto relative z-[150] w-full">{below}</div> : null}

      {anchored ? (
        <div className="pointer-events-none absolute inset-x-0 top-full z-[140] mt-2 flex justify-center">
          {anchored}
        </div>
      ) : null}
    </div>
  );
}
