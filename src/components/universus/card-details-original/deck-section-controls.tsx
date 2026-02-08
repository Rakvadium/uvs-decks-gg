import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CachedCard } from "@/lib/universus";
import { canAddCardToSection, getCardCopyLimit, getCardSectionCounts, useDeckEditor } from "@/lib/deck";

interface DeckSectionControlsProps {
  card: CachedCard;
}

export function DeckSectionControls({ card }: DeckSectionControlsProps) {
  const { hasDeck, addCard, removeCard, mainCounts, sideCounts, referenceCounts } = useDeckEditor();

  const sectionCounts = useMemo(
    () => ({ mainCounts, sideCounts, referenceCounts }),
    [mainCounts, sideCounts, referenceCounts]
  );

  const counts = useMemo(
    () =>
      getCardSectionCounts(card._id, sectionCounts),
    [card._id, sectionCounts]
  );

  const copyLimit = useMemo(() => getCardCopyLimit(card), [card]);

  if (!hasDeck) return null;

  const sections = [
    {
      key: "main" as const,
      label: "Main",
      count: counts.main,
      canAdd: canAddCardToSection({ card, cardId: card._id, section: "main", counts: sectionCounts }),
    },
    {
      key: "side" as const,
      label: "Side",
      count: counts.side,
      canAdd: canAddCardToSection({ card, cardId: card._id, section: "side", counts: sectionCounts }),
    },
    {
      key: "reference" as const,
      label: "Reference",
      count: counts.reference,
      canAdd: canAddCardToSection({ card, cardId: card._id, section: "reference", counts: sectionCounts }),
    },
  ];

  return (
    <div className="mt-4 space-y-2">
      <span className="block text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Deck Sections
      </span>

      {sections.map((section) => (
        <div
          key={section.key}
          className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-card/40 px-2.5 py-1.5"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {section.label}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => removeCard(card._id, section.key)}
              disabled={section.count === 0}
              className="border-destructive/30 hover:border-destructive hover:bg-destructive/10"
            >
              <Minus className="h-4 w-4 text-destructive" />
            </Button>
            <span className="w-7 text-center font-mono text-xs font-bold text-primary">{section.count}</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => addCard(card._id, section.key)}
              disabled={!section.canAdd}
              className="border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>
      ))}

      {copyLimit !== Number.POSITIVE_INFINITY && (
        <span className="block text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Limit {copyLimit} in Main/Side
        </span>
      )}
    </div>
  );
}
