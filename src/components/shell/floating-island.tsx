"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
          "relative rounded-full p-px transition-shadow duration-300",
          "bg-[linear-gradient(115deg,color-mix(in_oklch,var(--primary)_40%,transparent),color-mix(in_oklch,var(--border)_65%,transparent)_28%,color-mix(in_oklch,var(--border)_65%,transparent)_72%,color-mix(in_oklch,var(--secondary)_40%,transparent))]",
          "shadow-[0_4px_16px_-10px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_36px_-16px_rgba(0,0,0,0.75)]",
          "focus-within:shadow-[0_6px_24px_-12px_color-mix(in_oklch,var(--primary)_24%,transparent)] dark:focus-within:shadow-[0_12px_44px_-12px_color-mix(in_oklch,var(--primary)_38%,transparent),0_0_24px_-8px_color-mix(in_oklch,var(--secondary)_30%,transparent)]"
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
      <div className={cn("pointer-events-auto relative w-full max-w-3xl", capsuleClassName)}>
        <FloatingIslandCapsule bodyClassName={bodyClassName}>{children}</FloatingIslandCapsule>

        {anchored}
      </div>

      {below}
    </div>
  );
}
