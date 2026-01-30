"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { SlotRenderer } from "./shell-slot-provider";

export function TopHeader() {
  return (
    <header className="relative flex h-14 shrink-0 items-center bg-sidebar border-sidebar-border px-4">
      <div className="flex items-center gap-2 z-10 shrink-0">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="whitespace-nowrap text-lg font-semibold text-sidebar-foreground">
            UVSDECKS.GG
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <SlotRenderer area="top-bar" />
      </div>
    </header>
  );
}
