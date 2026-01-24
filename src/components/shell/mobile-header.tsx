"use client"

import { Layers } from "lucide-react"
import Link from "next/link"

export function MobileHeader() {
  return (
    <header className="flex shrink-0 h-14 items-center justify-between bg-sidebar border-b border-sidebar-border px-3">
      <Link href="/home" className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Layers className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">
          UVS Decks
        </span>
      </Link>
    </header>
  )
}
