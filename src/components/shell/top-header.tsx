"use client";

import Link from "next/link";
import { Hexagon } from "lucide-react";
import { SlotRenderer } from "./shell-slot-provider";

export function TopHeader() {
  return (
    <header className="relative flex h-16 shrink-0 items-center bg-sidebar border-b border-sidebar-border/50 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="flex items-center gap-3 z-10 shrink-0">
        <Link href="/home" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-primary/20 border border-primary/40 shadow-[0_0_8px_-2px_var(--primary)] group-hover:shadow-[0_0_12px_-2px_var(--primary)] transition-shadow duration-300" />
            <Hexagon className="relative h-5 w-5 text-primary drop-shadow-[0_0_3px_var(--primary)]" />
          </div>
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-lg font-display font-bold tracking-widest text-foreground uppercase">
              UVS<span className="text-primary">DECKS</span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground tracking-[0.3em] uppercase -mt-1">
              .GG
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 overflow-hidden relative z-10">
        <SlotRenderer area="top-bar" />
      </div>

      <div className="hidden lg:flex items-center gap-4 z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/60">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
          <span className="uppercase tracking-widest">Online</span>
        </div>
      </div>
    </header>
  );
}
