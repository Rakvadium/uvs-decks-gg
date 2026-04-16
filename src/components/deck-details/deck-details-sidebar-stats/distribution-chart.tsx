import { useMemo } from "react";
import { type PieChartColorStrategy, resolvePieBucketColor } from "./constants";

interface DistributionBucket {
  label: string;
  value: number;
}

interface PieDistributionChartProps {
  title: string;
  buckets: DistributionBucket[];
  total: number;
  colorStrategy?: PieChartColorStrategy;
}

export function PieDistributionChart({
  title,
  buckets,
  total,
  colorStrategy = "default",
}: PieDistributionChartProps) {
  const chartTotal = total > 0 ? total : buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const nonZeroBuckets = buckets.filter((bucket) => bucket.value > 0);

  const visibleBuckets = useMemo(() => {
    if (nonZeroBuckets.length <= 6) return nonZeroBuckets;

    const [first, second, third, fourth, fifth, ...rest] = nonZeroBuckets;
    const otherValue = rest.reduce((sum, bucket) => sum + bucket.value, 0);

    return [first, second, third, fourth, fifth, { label: "Other", value: otherValue }];
  }, [nonZeroBuckets]);

  const gradient = useMemo(() => {
    if (chartTotal <= 0 || visibleBuckets.length === 0) return "transparent";

    const raw = visibleBuckets.map((b) => (b.value / chartTotal) * 100);
    const sum = raw.reduce((a, b) => a + b, 0) || 1;
    const slices = raw.map((p) => (p / sum) * 100);

    const edges: number[] = [0];
    for (const s of slices) {
      edges.push(edges[edges.length - 1]! + s);
    }
    edges[edges.length - 1] = 100;

    const stops: string[] = [];
    for (const [index, bucket] of visibleBuckets.entries()) {
      const color = resolvePieBucketColor(colorStrategy, bucket.label, index);
      const start = edges[index]!;
      const end = edges[index + 1]!;
      stops.push(`${color} ${start.toFixed(4)}% ${end.toFixed(4)}%`);
    }

    return `conic-gradient(from 359.92deg, ${stops.join(", ")})`;
  }, [chartTotal, visibleBuckets, colorStrategy]);

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card/30 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{title}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{chartTotal}</span>
      </div>

      {visibleBuckets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No data.</p>
      ) : (
        <div className="grid grid-cols-[86px_1fr] items-start gap-3">
          <div
            className="relative isolate h-[86px] w-[86px] shrink-0 rounded-full ring-1 ring-inset ring-border/40 [transform:translateZ(0)]"
            style={{ background: gradient }}
          >
            <div className="absolute inset-[19px] flex items-center justify-center rounded-full bg-background/90 ring-1 ring-inset ring-border/40">
              <span className="font-mono text-[10px] text-primary">{chartTotal}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {visibleBuckets.map((bucket, index) => {
              const ratio = chartTotal > 0 ? (bucket.value / chartTotal) * 100 : 0;
              const color = resolvePieBucketColor(colorStrategy, bucket.label, index);

              return (
                <div key={`${title}-${bucket.label}`} className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate text-muted-foreground">{bucket.label}</span>
                  </div>
                  <span className="shrink-0 text-primary">
                    {bucket.value} ({Math.round(ratio)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export type { DistributionBucket };
