import { DeckDetailsTopBarDeleteAction } from "./delete-action";

interface DeckDetailsTopBarEditActionsProps {
  compact?: boolean;
}

export function DeckDetailsTopBarEditActions({ compact = false }: DeckDetailsTopBarEditActionsProps) {
  return <DeckDetailsTopBarDeleteAction compact={compact} />;
}
