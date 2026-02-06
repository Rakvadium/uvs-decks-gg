import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "./context";
import { StatInput } from "./stat-input";
import { ZONE_OPTIONS } from "./constants";

function ZoneSelector({
  filterKey,
}: {
  filterKey: "blockZone" | "attackZone";
}) {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const selectedZones = filters[filterKey] ?? [];

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      <span className="w-14 shrink-0 text-[11px] font-mono text-muted-foreground md:w-16">Zone</span>
      <div className="flex h-7 flex-1 items-center overflow-hidden rounded-md border border-border/50 bg-background/50">
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
                  ? "bg-primary/20 text-primary shadow-[inset_0_0_8px_-3px_var(--primary)]"
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

export function StatsSection() {
  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Stats</span>
      <div className="space-y-3 rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Card</span>
            <div className="space-y-1.5">
              <StatInput label="Difficulty" filterKey="difficulty" />
              <StatInput label="Control" filterKey="control" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Block</span>
            <div className="space-y-1.5">
              <ZoneSelector filterKey="blockZone" />
              <StatInput label="Modifier" filterKey="blockModifier" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Attack</span>
            <div className="space-y-1.5">
              <ZoneSelector filterKey="attackZone" />
              <StatInput label="Speed" filterKey="speed" />
              <StatInput label="Damage" filterKey="damage" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">General</span>
            <div className="space-y-1.5">
              <StatInput label="Health" filterKey="health" />
              <StatInput label="Hand Size" filterKey="handSize" />
              <StatInput label="Stamina" filterKey="stamina" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
