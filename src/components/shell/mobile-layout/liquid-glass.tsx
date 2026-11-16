"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { MOBILE_GLASS_GRADIENT_RING } from "../mobile-glass";

/**
 * One glass look for the Menu/Pannu chrome (dock, tools pill, action menu, panels): the
 * `bg-background-elevated` surface step (80%), the `backdrop-glass` ladder step (blur + saturation),
 * and the chrome's `--chrome-glass-highlight` edge. Pair it with `GlassRing` so every piece has the
 * same border as the nav capsules.
 */
export const LIQUID_GLASS = "bg-background-elevated backdrop-glass shadow-[var(--chrome-glass-highlight)]";

const RING_MASK: CSSProperties = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
};

/**
 * The nav capsules' gradient edge (primary → border → secondary) drawn as a 1px ring over any
 * rounded box. The parent must be positioned; the ring inherits its corner radius.
 */
export function GlassRing({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit] p-px", MOBILE_GLASS_GRADIENT_RING, className)}
      style={RING_MASK}
    />
  );
}
