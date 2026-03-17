import Link from "next/link";
import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "./context";

export function LeftSidebarBrand() {
  const { collapsed } = useLeftSidebarContext();

  return (
    <div className={cn("px-3 pb-2 pt-4", collapsed ? "flex justify-center" : "") }>
      <Link href="/gallery" className="group flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-lg border border-primary/40 bg-primary/20 shadow-[0_0_2px_var(--primary)/50,0_0_5px_var(--primary)/40] transition-shadow duration-150 group-hover:shadow-[0_0_3px_var(--primary),0_0_8px_var(--primary)/60]" />
          <Hexagon className="relative h-5 w-5 text-primary drop-shadow-[0_0_3px_var(--primary)]" />
        </div>

        {!collapsed ? (
          <div className="flex flex-col">
            <span className="whitespace-nowrap font-display text-lg font-bold uppercase tracking-widest text-foreground">
              UVS<span className="text-primary">DECKS</span>
            </span>
            <span className="-mt-1 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              .GG
            </span>
          </div>
        ) : null}
      </Link>
    </div>
  );
}
