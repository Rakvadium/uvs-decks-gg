"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMobileShell } from "../mobile-shell-context";

interface MobileNavTitleProps {
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
}

export function MobileNavTitle({ children, className, collapsible = false }: MobileNavTitleProps) {
  const { isLargeTitleVisible } = useMobileShell();
  const hidden = collapsible && isLargeTitleVisible;

  return (
    <h1
      className={cn(
        "chrome-heading-case min-w-0 truncate px-1 text-center text-[15px] font-semibold text-foreground",
        "motion-safe:transition-[opacity,transform] motion-safe:duration-200",
        hidden ? "translate-y-1.5 opacity-0" : "translate-y-0 opacity-100",
        className
      )}
      aria-hidden={hidden || undefined}
    >
      {children}
    </h1>
  );
}
