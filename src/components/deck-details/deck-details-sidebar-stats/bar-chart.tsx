import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DistributionBucket } from "./chart-data";

interface BarDistributionChartProps {
  title: string;
  buckets: DistributionBucket[];
  total: number;
}

const PLOT_HEIGHT = 72;

/**
 * Single-series column chart for curves (e.g. Cyberpunk cost curve). One hue (primary), counts
 * labeled above non-empty columns, a per-column tooltip with the share.
 */
export function BarDistributionChart({ title, buckets, total }: BarDistributionChartProps) {
  const chartTotal = total > 0 ? total : buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.value));

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <span className="chrome-label-case text-[10px] text-muted-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground">{chartTotal}</span>
      </div>

      {buckets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No data.</p>
      ) : (
        <div role="table" aria-label={title} className="space-y-1">
          <div role="row" className="flex items-end gap-0.5" style={{ height: PLOT_HEIGHT + 14 }}>
            {buckets.map((bucket) => {
              const ratio = chartTotal > 0 ? Math.round((bucket.value / chartTotal) * 100) : 0;
              const height = bucket.value > 0 ? Math.max(3, (bucket.value / max) * PLOT_HEIGHT) : 0;
              return (
                <Tooltip key={bucket.label}>
                  <TooltipTrigger asChild>
                    <div
                      role="cell"
                      aria-label={`${bucket.label}: ${bucket.value} (${ratio}%)`}
                      className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                    >
                      <span className="mb-0.5 text-[10px] leading-none tabular-nums text-muted-foreground">
                        {bucket.value > 0 ? bucket.value : ""}
                      </span>
                      <span
                        className="w-full rounded-t-[4px] bg-primary/60 transition-colors duration-150 group-hover:bg-primary"
                        style={{ height }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {title} {bucket.label}: {bucket.value} ({ratio}%)
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <div aria-hidden className="flex gap-0.5 border-t border-border/40 pt-1">
            {buckets.map((bucket) => (
              <span
                key={bucket.label}
                className="min-w-0 flex-1 truncate text-center text-[10px] leading-none tabular-nums text-muted-foreground"
              >
                {bucket.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
