"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MOBILE_TAB_ACT_SIZE_CLASS } from "./metrics";

interface MobileActButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  label: string;
  active?: boolean;
  badge?: number;
  tone?: "default" | "primary";
  children: ReactNode;
}

export const MOBILE_ACT_BUTTON_CLASS =
  "relative flex shrink-0 items-center justify-center rounded-full text-foreground transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 motion-safe:transition-[color,background-color,transform] disabled:pointer-events-none disabled:opacity-40";

export function MobileActButton({
  label,
  active = false,
  badge,
  tone = "default",
  className,
  children,
  type = "button",
  ...props
}: MobileActButtonProps) {
  const showBadge = typeof badge === "number" && badge > 0;

  return (
    <button
      type={type}
      aria-label={showBadge ? `${label}, ${badge} active` : label}
      className={cn(
        MOBILE_ACT_BUTTON_CLASS,
        MOBILE_TAB_ACT_SIZE_CLASS,
        tone === "primary" && "text-primary hover:bg-primary/10",
        active && "bg-primary/20 text-primary",
        className
      )}
      {...props}
    >
      {children}
      {showBadge ? (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-[var(--chrome-floating-shadow)]"
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
