import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Kicker } from "@/components/ui/typography-headings";

interface LoadingProgressProps {
  progress: number;
  isLoadingMore: boolean;
}

export function LoadingProgress({ progress, isLoadingMore }: LoadingProgressProps) {
  if (!isLoadingMore || progress >= 100) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-lg border border-primary/30 bg-card/95 p-4 backdrop-blur-lg" style={{ boxShadow: "var(--chrome-gallery-loading-shadow)" }}>
      <div className="relative">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-primary/20" />
      </div>
      <div className="flex flex-col gap-2">
        <Kicker className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Syncing Database
        </Kicker>
        <div className="h-2 w-44 overflow-hidden rounded-full bg-muted/50">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ boxShadow: "var(--chrome-gallery-progress-bar-glow)" }}
          />
        </div>
      </div>
      <span className="text-sm font-mono font-bold text-primary">{progress}%</span>
    </div>
  );
}
