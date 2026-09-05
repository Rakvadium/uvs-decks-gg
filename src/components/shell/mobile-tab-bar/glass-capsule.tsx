"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MOBILE_GLASS_GRADIENT_RING, MOBILE_GLASS_SURFACE } from "../mobile-glass";

interface MobileGlassCapsuleProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function MobileGlassCapsule({ children, className, bodyClassName }: MobileGlassCapsuleProps) {
  return (
    <div
      className={cn(
        "relative rounded-full p-px shadow-[var(--chrome-floating-shadow)]",
        MOBILE_GLASS_GRADIENT_RING,
        className
      )}
    >
      <div className={cn("relative flex items-center rounded-full", MOBILE_GLASS_SURFACE, bodyClassName)}>
        {children}
      </div>
    </div>
  );
}

export const MOBILE_ROUND_BUTTON =
  "flex size-full items-center justify-center rounded-full text-foreground transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 motion-safe:transition-[color,background-color,transform]";
