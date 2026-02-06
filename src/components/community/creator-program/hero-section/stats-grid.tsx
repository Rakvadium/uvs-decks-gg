import { HERO_STATS } from "../data";

export function CreatorProgramHeroStatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {HERO_STATS.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-display font-bold text-foreground">{stat.value}</div>
          </div>
        );
      })}
    </div>
  );
}
