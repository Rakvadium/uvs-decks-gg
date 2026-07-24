"use client"

import { cn } from "@/lib/utils"
import { AppBrandLink } from "@/components/brand/app-brand-link"
import { ShellFeedbackNav } from "@/components/shell/shell-feedback-nav"
import { ShellUniversusNav } from "@/components/shell/shell-universus-nav"
import {
  SHELL_CHROME_EDGE_BOTTOM,
  SHELL_CHROME_SURFACE,
  SHELL_CHROME_WASH_STYLE,
} from "./shell-chrome"

export function MobileHeader() {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-2 px-3",
        SHELL_CHROME_SURFACE,
        SHELL_CHROME_EDGE_BOTTOM
      )}
    >
      <div className="pointer-events-none absolute inset-0" style={SHELL_CHROME_WASH_STYLE} />

      <AppBrandLink
        className="relative z-10 gap-2.5"
        markSize="sm"
        wordmarkLayout="inline"
      />

      <div className="relative z-10 flex shrink-0 items-center gap-1.5">
        <ShellUniversusNav variant="mobile-header" />
        <ShellFeedbackNav variant="mobile-header" />
      </div>
    </header>
  )
}
