import { Swords, Zap } from "lucide-react";
import { useCardDetailsContent } from "./content-context";
import { StatBlock } from "./stat-block";
import { ZoneIndicator } from "./zone-indicator";

export function CardDetailsAttackStatsSection() {
  const { card } = useCardDetailsContent();

  const hasAttackStats = card.speed !== undefined || Boolean(card.attackZone) || card.damage !== undefined;

  if (!hasAttackStats) return null;

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Attack</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatBlock icon={Zap} label="Speed" value={card.speed} color="accent" />
        <ZoneIndicator zone={card.attackZone} label="Zone" />
        <StatBlock icon={Swords} label="Damage" value={card.damage} color="accent" />
      </div>
    </div>
  );
}
