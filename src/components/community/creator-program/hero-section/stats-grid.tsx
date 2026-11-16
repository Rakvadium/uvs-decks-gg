import { HERO_STATS } from "../data";
import { Panel } from "@/components/ui/panel";

export function CreatorProgramHeroStatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {HERO_STATS.map((stat) => {
        const Icon = stat.icon;

        return (
          <Panel key={stat.label} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="chrome-label-case text-xs text-muted-foreground">{stat.label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">{stat.value}</div>
          </Panel>
        );
      })}
    </div>
  );
}
