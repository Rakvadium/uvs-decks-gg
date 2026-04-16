import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "./context";
import { StatInput } from "./stat-input";
import { ZONE_OPTIONS } from "./constants";

function ZoneSelector({
  filterKey,
  hideZoneLabel = false,
}: {
  filterKey: "blockZone" | "attackZone";
  hideZoneLabel?: boolean;
}) {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const selectedZones = filters[filterKey] ?? [];

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      {!hideZoneLabel ? (
        <span className="w-14 shrink-0 text-[11px] font-mono text-muted-foreground md:w-16">Zone</span>
      ) : null}
      <div className="flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md border border-border/50 bg-background/50">
        {ZONE_OPTIONS.map((zone, index) => {
          const selected = selectedZones.includes(zone);

          return (
            <button
              key={zone}
              type="button"
              className={cn(
                "h-full flex-1 text-[10px] font-mono transition-all",
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
  "text-xs font-mono uppercase tracking-widest text-muted-foreground/70";

export function StatsSection({ plain = false }: { plain?: boolean } = {}) {
  const statsGroupShell =
    "flex flex-col gap-4 rounded-md border border-border/50 bg-background/50 p-2.5";

  const grid = (
    <div className="grid grid-cols-2 items-start gap-4">
      <div className={statsGroupShell}>
        <span className={statsSectionLabelClass}>General</span>
        <div className="space-y-1.5">
          <StatInput label="Difficulty" filterKey="difficulty" />
          <StatInput label="Control" filterKey="control" />
          <StatInput label="Health" filterKey="health" />
          <StatInput label="Hand Size" filterKey="handSize" />
          <StatInput label="Stamina" filterKey="stamina" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className={statsGroupShell}>
          <span className={statsSectionLabelClass}>Block</span>
          <div className="space-y-1.5">
            <ZoneSelector filterKey="blockZone" hideZoneLabel={plain} />
            <StatInput label="Modifier" filterKey="blockModifier" labelPosition="end" />
          </div>
        </div>

        <div className={statsGroupShell}>
          <span className={statsSectionLabelClass}>Attack</span>
          <div className="space-y-1.5">
            <ZoneSelector filterKey="attackZone" hideZoneLabel={plain} />
            <StatInput label="Speed" filterKey="speed" labelPosition="end" />
            <StatInput label="Damage" filterKey="damage" labelPosition="end" />
          </div>
        </div>
      </div>
    </div>
  );

  if (plain) {
    return grid;
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Stats</span>
      <div className="space-y-3 rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
        {grid}
      </div>
    </div>
  );
}
