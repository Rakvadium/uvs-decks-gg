"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const islandRingVarClassName =
  "[--island-ring:linear-gradient(115deg,color-mix(in_oklch,var(--primary)_40%,transparent),color-mix(in_oklch,var(--border)_65%,transparent)_28%,color-mix(in_oklch,var(--border)_65%,transparent)_72%,color-mix(in_oklch,var(--secondary)_40%,transparent))]";

export const floatingIslandRingClassName = cn(islandRingVarClassName, "bg-(image:--island-ring)");

// One opaque element: the fill paints the padding box and the gradient ring shows only through the
// transparent 1px border. Hover states change --island-fill, so backgroundColor tracks the fill.
export const floatingIslandSurfaceClassName = cn(
  "rounded-island border border-transparent bg-(--island-fill) shadow-[var(--chrome-floating-shadow)] [--island-fill:var(--background)]",
  "[background-clip:padding-box,border-box] [background-origin:border-box] [background-image:linear-gradient(var(--island-fill),var(--island-fill)),var(--island-ring)]",
  islandRingVarClassName
);

export const floatingIslandHoverClassName =
  "hover:[--island-fill:color-mix(in_oklab,var(--accent)_10%,var(--background))]";

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
        data-slot="floating-island"
        className={cn(
          floatingIslandSurfaceClassName,
          "relative flex h-(--control-h-md) w-full min-w-0 items-center gap-1 pl-4 pr-2 transition-shadow duration-300 focus-within:shadow-[var(--chrome-floating-shadow-focus)]",
          bodyClassName
        )}
      >
        {children}
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
