import { Database, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

interface GalleryStatsProps {
  totalCards: number;
  filteredCount: number;
  isLoading: boolean;
}

export function GalleryStats({ totalCards, filteredCount, isLoading }: GalleryStatsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-2 py-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <Database className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg leading-none font-display font-bold text-foreground">
            {filteredCount.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {filteredCount === totalCards ? "Total Cards" : `of ${totalCards.toLocaleString()}`}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-border/50" />

      <div className="flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading</span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ready</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
