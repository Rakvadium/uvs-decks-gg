import { cn } from "@/lib/utils";
import { parseZoneDisplay } from "./parsers";

interface ZoneIndicatorProps {
  zone?: string;
  label: string;
}

export function ZoneIndicator({ zone, label }: ZoneIndicatorProps) {
  const zones = parseZoneDisplay(zone);

  if (zones.length === 0) return null;

  const primaryZone = zones[0];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        primaryZone.borderColor,
        primaryZone.bgColor
      )}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          {zones.map((value, index) => (
            <span key={`${value.label}-${index}`} className={cn("text-lg font-display font-bold", value.textColor)}>
              {value.label}
              {index < zones.length - 1 ? <span className="mx-0.5 text-muted-foreground/50">/</span> : ""}
            </span>
          ))}
        </div>
        <span className={cn("text-[10px] font-mono uppercase tracking-widest opacity-70", primaryZone.textColor)}>
          {label}
        </span>
      </div>
    </div>
  );
}
