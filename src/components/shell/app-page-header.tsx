"use client";

import { PageHeading } from "@/components/ui/typography-headings";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SHELL_CHROME_EDGE_BOTTOM,
  SHELL_CHROME_TOP_SURFACE,
} from "./shell-chrome";

export interface AppPageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  tabs?: ReactNode;
  actions?: ReactNode;
  className?: string;
  innerClassName?: string;
  withBottomBorder?: boolean;
  secondaryRowFirst?: boolean;
  chrome?: boolean;
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
  secondaryRowFirst = false,
  chrome = true,
}: AppPageHeaderProps) {
  const secondaryRow = tabs ?? toolbar;

  const primaryRow = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        {typeof title === "string" ? (
          <PageHeading size="sm"
            className={cn("md:text-2xl",
              chrome ? "text-sidebar-foreground" : "text-foreground"
            )}
          >
            {title}
          </PageHeading>
        ) : (
          title
        )}
        {description ? (
          <div
            className={cn(
              "text-sm",
              chrome ? "text-sidebar-foreground/75" : "text-muted-foreground"
            )}
          >
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );

  const secondaryRowEl = secondaryRow ? (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        tabs && toolbar ? "justify-between" : tabs ? "justify-start" : "justify-end",
      )}
    >
      {tabs ? (
        <div className="flex min-h-[2.25rem] min-w-0 flex-1 items-center overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs}
        </div>
      ) : null}
      {toolbar ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
          {toolbar}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <header
      className={cn(
        chrome && SHELL_CHROME_TOP_SURFACE,
        withBottomBorder && (chrome ? SHELL_CHROME_EDGE_BOTTOM : "border-b border-border/50"),
        className
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-3 px-4 py-4 md:px-6 md:py-5",
          innerClassName
        )}
      >
        {secondaryRowFirst && secondaryRowEl}
        {primaryRow}
        {!secondaryRowFirst && secondaryRowEl}
      </div>
    </header>
  );
}
