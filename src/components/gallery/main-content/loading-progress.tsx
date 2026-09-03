"use client";

import { Loader2 } from "lucide-react";
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
        <Kicker>
          Syncing Database
        </Kicker>
        <div className="h-2 w-44 overflow-hidden rounded-full bg-muted/50">
          <div
            className="h-full w-full origin-left bg-gradient-to-r from-primary to-secondary motion-safe:transition-transform motion-safe:duration-200"
            style={{
              transform: `scaleX(${Math.min(Math.max(progress, 0), 100) / 100})`,
              boxShadow: "var(--chrome-gallery-progress-bar-glow)",
            }}
          />
        </div>
      </div>
      <span className="text-sm font-bold text-primary">{progress}%</span>
    </div>
  );
}
