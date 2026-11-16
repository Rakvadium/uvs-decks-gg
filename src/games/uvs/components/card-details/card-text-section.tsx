import { useCardDetailsContent } from "./content-context";
import { Panel } from "@/components/ui/panel";
import { AbilityText } from "./ability-text";
import { PreviousAbilityText } from "./previous-ability-text";

export function CardDetailsTextSection() {
  const { card } = useCardDetailsContent();

  if (!card.text) return null;

  return (
    <div className="space-y-2">
      <span className="chrome-label-case text-xs text-muted-foreground">Card Text</span>
      <Panel className="p-4">
        <AbilityText text={card.text} />
        <PreviousAbilityText cardId={card._id} />
      </Panel>
    </div>
  );
}
