"use client";

import { Badge } from "@/components/ui/badge";
import { PieDistributionChart } from "./distribution-chart";
import { StatsSidebarProvider, useStatsSidebarContext } from "./context";

function StatsSidebarContent() {
  const {
    deck,
    mainTotal,
    attackCardsTotal,
    typeDistribution,
    difficultyDistribution,
    checkValueDistribution,
    blockModifierDistribution,
    blockZoneDistribution,
    attackZoneDistribution,
    attackSpeedDistribution,
    attackDamageDistribution,
  } = useStatsSidebarContext();

  if (!deck) {
    return <div className="p-4 text-xs text-muted-foreground">Deck stats unavailable.</div>;
  }

  return (
    <div className="h-full space-y-3 overflow-y-auto p-4">
      <div className="flex items-center justify-end">
        <Badge variant="outline" className="font-mono text-[10px]">
          Main {mainTotal}
        </Badge>
      </div>

      {mainTotal === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
          Add cards to your Main deck to view stats.
        </div>
      ) : (
        <div className="space-y-3">
          <PieDistributionChart
            title="Card Type Ratios"
            buckets={typeDistribution}
            total={mainTotal}
            colorStrategy="cardTypeLabels"
          />
          <PieDistributionChart
            title="Difficulty"
            buckets={difficultyDistribution}
            total={mainTotal}
            colorStrategy="characterNumeric"
          />
          <PieDistributionChart
            title="Check Value"
            buckets={checkValueDistribution}
            total={mainTotal}
            colorStrategy="actionNumeric"
          />
          <PieDistributionChart
            title="Block Mods"
            buckets={blockModifierDistribution}
            total={mainTotal}
            colorStrategy="foundationNumeric"
          />
          <PieDistributionChart
            title="Block Zones"
            buckets={blockZoneDistribution}
            total={mainTotal}
            colorStrategy="zoneLabels"
          />
          <PieDistributionChart
            title="Attack Zones"
            buckets={attackZoneDistribution}
            total={attackCardsTotal}
            colorStrategy="zoneLabels"
          />
          <PieDistributionChart
            title="Attack Speed"
            buckets={attackSpeedDistribution}
            total={attackCardsTotal}
            colorStrategy="attackNumeric"
          />
          <PieDistributionChart
            title="Attack Damage"
            buckets={attackDamageDistribution}
            total={attackCardsTotal}
            colorStrategy="attackNumeric"
          />
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
