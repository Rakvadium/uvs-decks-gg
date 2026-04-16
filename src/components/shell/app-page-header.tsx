"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AppPageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  tabs?: ReactNode;
  actions?: ReactNode;
  className?: string;
  innerClassName?: string;
  withBottomBorder?: boolean;
}

export function AppPageHeader({
  title,
  description,
  toolbar,
  tabs,
  actions,
  className,
  innerClassName,
  withBottomBorder = true,
}: AppPageHeaderProps) {
  return (
    <header
      className={cn(
        withBottomBorder && "border-b border-border/50",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 px-4 py-4 md:px-6 md:py-5",
          innerClassName
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {typeof title === "string" ? (
              <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {title}
              </h1>
            ) : (
              title
            )}
            {description ? (
              <div className="text-sm text-muted-foreground">{description}</div>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {actions}
            </div>
          ) : null}
        </div>
        {toolbar ? (
          <div className="min-w-0">{toolbar}</div>
        ) : null}
        {tabs ? (
          <div className="min-w-0 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs}
          </div>
        ) : null}
      </div>
    </header>
  );
}
