import { Copy, Gauge, Heart, Shield, Target } from "lucide-react";
import { useCardDetailsContent } from "./content-context";
import { StatBlock } from "./stat-block";
import { ZoneIndicator } from "./zone-indicator";

export function CardDetailsGeneralStatsSection() {
  const { card } = useCardDetailsContent();

  const hasGeneralStats =
    card.control !== undefined ||
    card.difficulty !== undefined ||
    Boolean(card.blockZone) ||
    card.blockModifier !== undefined ||
    card.health !== undefined ||
    card.stamina !== undefined ||
    card.handSize !== undefined;

  if (!hasGeneralStats) return null;

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">General</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatBlock icon={Gauge} label="Difficulty" value={card.difficulty} color="orange" />
        <StatBlock icon={Shield} label="Check" value={card.control} color="primary" />

        {card.blockZone || card.blockModifier !== undefined ? (
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <ZoneIndicator zone={card.blockZone} label="Block Zone" />
            <StatBlock icon={Target} label="Block Mod" value={card.blockModifier} color="secondary" />
          </div>
        ) : null}

        <StatBlock icon={Heart} label="Health" value={card.health} color="destructive" />

        {card.stamina ? (
          <div className="flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2">
            <Gauge className="h-4 w-4 text-secondary" />
            <div className="flex flex-col">
              <span className="text-lg font-display font-bold text-secondary">{card.stamina}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-70 text-secondary">
                Vitality
              </span>
            </div>
          </div>
        ) : null}

        {card.handSize ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
            <Copy className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-lg font-display font-bold text-primary">{card.handSize}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-70 text-primary">
                Hand Size
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
