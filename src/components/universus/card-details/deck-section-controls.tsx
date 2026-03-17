import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CachedCard } from "@/lib/universus";
import {
  canAddCardToDeck,
  canAddCardToSection,
  getCardCopyLimit,
  getCardSectionCounts,
  type DeckSection,
  useDeckEditor,
} from "@/lib/deck";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DeckSectionControlsProps {
  card: CachedCard;
  layout?: "vertical" | "horizontal" | "compact";
}

export function DeckSectionControls({ card, layout = "vertical" }: DeckSectionControlsProps) {
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
  if (!canAddCardToDeck(card)) return null;

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
      label: "Ref",
      count: counts.reference,
      canAdd: canAddCardToSection({ card, cardId: card._id, section: "reference", counts: sectionCounts }),
    },
  ];
  const preferredSection = useMemo<DeckSection>(
    () => sections.find((section) => section.count > 0)?.key ?? "main",
    [sections]
  );
  const preferredSectionRef = useRef(preferredSection);
  preferredSectionRef.current = preferredSection;
  const [selectedSection, setSelectedSection] = useState<DeckSection>(preferredSection);

  useEffect(() => {
    setSelectedSection(preferredSectionRef.current);
  }, [card._id]);

  const activeSection = sections.find((section) => section.key === selectedSection) ?? sections[0];

  if (layout === "horizontal") {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedSection} onValueChange={(value) => setSelectedSection(value as DeckSection)}>
          <SelectTrigger
            size="sm"
            className="h-8 w-[7rem] bg-card/40 px-2 text-[10px] tracking-widest"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section.key} value={section.key}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-border/40 bg-card/40 px-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => removeCard(card._id, activeSection.key)}
            disabled={activeSection.count === 0}
            className="h-6 w-6 border-destructive/30 hover:border-destructive hover:bg-destructive/10"
          >
            <Minus className="h-3 w-3 text-destructive" />
          </Button>
          <span className="w-5 text-center font-mono text-xs font-bold text-primary">
            {activeSection.count}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => addCard(card._id, activeSection.key)}
            disabled={!activeSection.canAdd}
            className="h-6 w-6 border-primary/30 hover:border-primary hover:bg-primary/10"
          >
            <Plus className="h-3 w-3 text-primary" />
          </Button>
        </div>
      </div>
    );
  }

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
