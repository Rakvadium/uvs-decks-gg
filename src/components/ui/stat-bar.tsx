"use client";

import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  value: number;
  total: number;
  color?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StatBar({
  label,
  value,
  total,
  color,
  showPercentage = true,
  showValue = true,
  className,
}: StatBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {showValue && value}
          {showValue && showPercentage && " "}
          {showPercentage && `(${percentage.toFixed(0)}%)`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full w-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-200",
            color ?? "bg-primary"
          )}
          style={{ transform: `scaleX(${Math.min(Math.max(percentage, 0), 100) / 100})` }}
        />
      </div>
    </div>
  );
}

interface StatBarGroupProps {
  items: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  showPercentage?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StatBarGroup({
  items,
  showPercentage = true,
  showValue = true,
  className,
}: StatBarGroupProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <StatBar
          key={item.label || index}
          label={item.label}
          value={item.value}
          total={total}
          color={item.color}
          showPercentage={showPercentage}
          showValue={showValue}
        />
      ))}
    </div>
  );
}
