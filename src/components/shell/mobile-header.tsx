"use client"

import { Hexagon } from "lucide-react"
import Link from "next/link"
import { Kicker } from "@/components/ui/typography-headings"
import { ShellFeedbackNav } from "@/components/shell/shell-feedback-nav"

export function MobileHeader() {
  return (
    <header className="relative flex shrink-0 h-14 items-center justify-between gap-2 bg-sidebar border-b border-sidebar-border/50 px-3">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <Link
        href="/gallery"
        className="group relative z-10 flex min-w-0 items-center gap-2.5"
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-lg border border-primary/40 bg-primary/20 shadow-[var(--chrome-shell-brand-shadow)] transition-shadow duration-150 group-hover:shadow-[var(--chrome-shell-brand-shadow-hover)]" />
          <Hexagon className="relative h-4 w-4 text-primary [filter:var(--chrome-shell-icon-drop-shadow)]" />
        </div>
        <Kicker className="truncate text-sm font-display font-bold text-foreground whitespace-nowrap">
          UVS<span className="text-primary">DECKS</span>
          <span className="text-muted-foreground">.GG</span>
        </Kicker>
      </Link>

      <ShellFeedbackNav variant="mobile-header" />
    </header>
  )
}
