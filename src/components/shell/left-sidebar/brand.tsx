import Link from "next/link";
import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kicker } from "@/components/ui/typography-headings";
import { useLeftSidebarContext } from "./context";

export function LeftSidebarBrand() {
  const { collapsed } = useLeftSidebarContext();

  return (
    <div className={cn("px-3 pb-2 pt-4", collapsed ? "flex justify-center" : "") }>
      <Link href="/gallery" className="group flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-lg border border-primary/40 bg-primary/20 shadow-[var(--chrome-shell-brand-shadow)] transition-shadow duration-150 hover:shadow-[var(--chrome-shell-brand-shadow-hover)]" />
          <Hexagon className="relative h-5 w-5 text-primary [filter:var(--chrome-shell-icon-drop-shadow)]" />
        </div>

        {!collapsed ? (
          <div className="flex flex-col">
            <Kicker className="whitespace-nowrap font-display text-lg font-bold text-foreground">
              UVS<span className="text-primary">DECKS</span>
            </Kicker>
            <span className="-mt-1 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              .GG
            </span>
          </div>
        ) : null}
      </Link>
    </div>
  );
}
