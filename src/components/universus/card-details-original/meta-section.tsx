import { Separator } from "@/components/ui/separator";
import { useCardDetailsContent } from "./content-context";

export function CardDetailsMetaSection() {
  const { card } = useCardDetailsContent();

  return (
    <>
      <Separator className="bg-border/30" />

      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span className="uppercase tracking-widest">
          {card.setCode} • {card.rarity}
        </span>

        {card.oracleId ? <span className="opacity-50">Oracle: {card.oracleId.slice(0, 8)}...</span> : null}
      </div>
    </>
  );
}
