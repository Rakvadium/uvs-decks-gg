import { useCardDetailsContent } from "./content-context";
import { AbilityText } from "./ability-text";

export function CardDetailsTextSection() {
  const { card } = useCardDetailsContent();

  if (!card.text) return null;

  return (
    <div className="space-y-2">
      <span className="chrome-label-case text-xs text-muted-foreground">Card Text</span>
      <div className="rounded-lg border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
        <AbilityText text={card.text} />
      </div>
    </div>
  );
}
