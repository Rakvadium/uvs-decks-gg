import { Badge } from "@/components/ui/badge";
import { formatUniversusCardType } from "@/config/universus";
import { useDeckListItemContext } from "./context";

export function DeckListItemDetails() {
  const { card, isAttackType, quantity, sortKey } = useDeckListItemContext();

  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="min-w-0 flex items-center gap-2">
        <p className="truncate text-sm font-semibold leading-tight">{card.name}</p>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">x{quantity}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {card.type ? (
          <Badge variant="cyber" className="h-5 border-primary/40 bg-card/40 px-2 backdrop-blur-none">
            {formatUniversusCardType(card.type) ?? card.type}
          </Badge>
        ) : null}
        {card.difficulty !== undefined ? <span>Diff {card.difficulty}</span> : null}
        {card.control !== undefined ? <span>Ctrl {card.control}</span> : null}
        {card.blockModifier !== undefined ? <span>Block {card.blockModifier}</span> : null}
        {isAttackType && card.speed !== undefined ? <span>Spd {card.speed}</span> : null}
        {isAttackType && card.damage !== undefined ? <span>Dmg {card.damage}</span> : null}
        {sortKey === "blockZone" && card.blockZone ? <span>Block {card.blockZone}</span> : null}
        {sortKey === "attackZone" && isAttackType && card.attackZone ? <span>Atk {card.attackZone}</span> : null}
      </div>
    </div>
  );
}
