import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CachedCard } from "@/lib/universus/card-store";
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
  layout?: "vertical" | "horizontal" | "compact" | "detailsBar";
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

  const showDeckSectionControls = hasDeck && canAddCardToDeck(card);

  const sections = useMemo(
    () => {
      if (!showDeckSectionControls) {
        return [] as {
          key: DeckSection;
          label: string;
          count: number;
          canAdd: boolean;
        }[];
      }
      return [
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
    },
    [showDeckSectionControls, card, sectionCounts, counts]
  );

  const [selectedSection, setSelectedSection] = useState<DeckSection>(
    () => sections.find((s) => s.count > 0)?.key ?? "main"
  );

  const activeSection = sections.find((section) => section.key === selectedSection) ?? sections[0];

  if (!showDeckSectionControls) return null;

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

  if (layout === "detailsBar") {
    return (
      <div
        className={cn(
          "pointer-events-auto absolute bottom-0 left-0 z-20 flex w-max min-w-0 max-w-full items-stretch",
          "rounded-bl-xl rounded-tl-none rounded-tr-xl rounded-br-none",
          "border border-primary/25 bg-card/95 shadow-none backdrop-blur-sm"
        )}
      >
        <div className="flex h-9 min-w-0 max-w-full items-center gap-1.5 py-0 pl-1.5 pr-2 sm:gap-2 sm:pl-1.5 sm:pr-2.5">
          <Select value={selectedSection} onValueChange={(value) => setSelectedSection(value as DeckSection)}>
            <SelectTrigger
              size="sm"
              className="h-8 w-28 min-w-0 shrink-0 border-0 bg-transparent px-0.5 text-xs font-mono font-semibold uppercase tracking-widest shadow-none focus:ring-0"
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
          <div className="h-5 w-px shrink-0 self-center bg-border/45" aria-hidden />
          <div className="flex min-w-0 items-center justify-center gap-0.5 sm:pr-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeCard(card._id, activeSection.key)}
              disabled={activeSection.count === 0}
              className="h-7 w-7 border-0 text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[1.5rem] text-center text-sm font-mono font-bold text-primary">
              {activeSection.count}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => addCard(card._id, activeSection.key)}
              disabled={!activeSection.canAdd}
              className="h-7 w-7 border-0 text-primary shadow-none hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
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
