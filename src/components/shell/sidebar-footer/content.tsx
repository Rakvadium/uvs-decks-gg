"use client";

import { cn } from "@/lib/utils";
import { FooterActionButton } from "./action-button";
import type { SidebarFooterProps } from "./types";

export function SidebarFooter({
  primaryAction,
  secondaryAction,
  align = "between",
  className,
  children,
}: SidebarFooterProps) {
  if (!children && !primaryAction && !secondaryAction) return null;

  const alignClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  }[align];

  if (children) {
    return <div className={cn("flex items-center gap-2", alignClass, className)}>{children}</div>;
  }

  return (
    <div className={cn("flex items-center gap-2", alignClass, className)}>
      {secondaryAction ? <FooterActionButton action={secondaryAction} defaultFullWidth={false} /> : null}
      {primaryAction ? <FooterActionButton action={primaryAction} defaultFullWidth={false} /> : null}
    </div>
  );
}
