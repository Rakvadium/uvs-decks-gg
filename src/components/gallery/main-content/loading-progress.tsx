import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingProgressProps {
  progress: number;
  isLoadingMore: boolean;
}

export function LoadingProgress({ progress, isLoadingMore }: LoadingProgressProps) {
  if (!isLoadingMore || progress >= 100) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-lg border border-primary/30 bg-card/95 p-4 shadow-[0_0_30px_-5px_var(--primary)] backdrop-blur-lg">
      <div className="relative">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-primary/20" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Syncing Database
        </span>
        <div className="h-2 w-44 overflow-hidden rounded-full bg-muted/50">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ boxShadow: "0 0 10px var(--primary)" }}
          />
        </div>
      </div>
      <span className="text-sm font-mono font-bold text-primary">{progress}%</span>
    </div>
  );
}
