import { useMemo } from "react";
import { getFilterGroupLayout, type GameZoneFilterDescriptor } from "@shared/games/filters";
import { useGameModule } from "@/games/game-context";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "./context";
import { StatInput } from "./stat-input";
import type { StatFilterKey, StringArrayFilterKey } from "./types";

function ZoneSelector({
  zone: descriptor,
  hideZoneLabel = false,
}: {
  zone: GameZoneFilterDescriptor;
  hideZoneLabel?: boolean;
}) {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const filterKey = descriptor.key as StringArrayFilterKey;
  const selectedZones = filters[filterKey] ?? [];

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      {!hideZoneLabel ? (
        <span className="w-14 shrink-0 text-[11px] text-muted-foreground md:w-16">{descriptor.label}</span>
      ) : null}
      <div className="flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md border border-border/50 bg-background/50">
        {descriptor.options.map((zone, index) => {
          const selected = selectedZones.includes(zone);

          return (
            <button
              key={zone}
              type="button"
              className={cn(
                "h-full flex-1 text-[10px] transition-colors",
                index !== 0 && "border-l border-border/50",
                selected
                  ? "bg-primary/20 text-primary shadow-[var(--chrome-filter-tile-shadow-selected-inset)]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => toggleStringFilter(filterKey, zone)}
            >
              {zone}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const statsSectionLabelClass =
  "chrome-label-case text-xs text-muted-foreground/70";

export function StatsSection({
  plain = false,
  columns = false,
}: { plain?: boolean; columns?: boolean } = {}) {
  const { filters: filterDefinition } = useGameModule();
  const groups = useMemo(() => getFilterGroupLayout(filterDefinition), [filterDefinition]);
  const statsGroupShell =
    "flex flex-col gap-4 rounded-md border border-border/50 bg-background/50 p-2.5";

  const grid = (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-4",
        columns ? "@2xl:grid-cols-3" : "md:grid-cols-2"
      )}
    >
      {groups.map((group, index) => (
        <div
          key={group.id}
          className={cn(statsGroupShell, index === 0 && !columns && "md:row-span-2", "w-full min-w-0")}
        >
          <span className={statsSectionLabelClass}>{group.label}</span>
          <div className="space-y-1.5">
            {group.zones.map((zone) => (
              <ZoneSelector key={zone.key} zone={zone} hideZoneLabel={plain} />
            ))}
            {group.stats.map((stat) => (
              <StatInput
                key={stat.key}
                label={stat.label}
                filterKey={stat.key as StatFilterKey}
                labelPosition="end"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (plain) {
    return grid;
  }

  return (
    <div className="space-y-2">
      <span className="chrome-label-case text-xs text-muted-foreground">Stats</span>
      <div className="md:rounded-lg md:border md:border-border/50 md:bg-card/30 md:p-3 md:backdrop-blur-sm">
        {grid}
      </div>
    </div>
  );
}
