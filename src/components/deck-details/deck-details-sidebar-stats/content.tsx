"use client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BarDistributionChart } from "./bar-chart";
import { PieDistributionChart } from "./distribution-chart";
import { StatsSidebarProvider, useStatsSidebarContext } from "./context";

function StatsSidebarContent() {
  const { deck, mainTotal, charts } = useStatsSidebarContext();

  if (!deck) {
    return <div className="p-4 text-xs text-muted-foreground">Deck stats unavailable.</div>;
  }

  return (
    <div className="h-full space-y-3 overflow-y-auto p-4">
      <div className="flex items-center justify-end">
        <Badge size="sm" variant="outline">
          Main {mainTotal}
        </Badge>
      </div>

      {mainTotal === 0 ? (
        <EmptyState variant="inline" title="Add cards to your Main deck to view stats." />
      ) : (
        <div className="space-y-3">
          {charts.map(({ chart, buckets, total }) =>
            chart.kind === "numeric" && chart.display === "bars" ? (
              <BarDistributionChart key={chart.id} title={chart.title} buckets={buckets} total={total} />
            ) : (
              <PieDistributionChart
                key={chart.id}
                title={chart.title}
                buckets={buckets}
                total={total}
                colorStrategy={chart.colorStrategy}
                labelColors={chart.labelColors}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export function StatsSidebar() {
  return (
    <StatsSidebarProvider>
      <StatsSidebarContent />
    </StatsSidebarProvider>
  );
}
