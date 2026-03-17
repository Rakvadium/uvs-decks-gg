"use client"

import { Hexagon } from "lucide-react"
import Link from "next/link"

export function MobileHeader() {
  return (
    <header className="relative flex shrink-0 h-14 items-center justify-between bg-sidebar border-b border-sidebar-border/50 px-3">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <Link href="/gallery" className="relative z-10 flex items-center gap-2.5">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-lg bg-primary/20 border border-primary/40 shadow-[0_0_12px_var(--primary)]" />
          <Hexagon className="relative h-4 w-4 text-primary drop-shadow-[0_0_6px_var(--primary)]" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-display font-bold tracking-widest text-foreground uppercase">
            UVS<span className="text-primary">DECKS</span>
          </span>
        </div>
      </Link>

    </header>
  )
}
