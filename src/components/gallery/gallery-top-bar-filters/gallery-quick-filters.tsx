"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import { FormatTypeRaritySection } from "@/components/gallery/filter-dialog/format-type-rarity-section/content";
import { KeywordsPickerPanel } from "@/components/gallery/filter-dialog/keywords-picker-panel";
import { SetSection } from "@/components/gallery/filter-dialog/set-section";
import { StatsSection } from "@/components/gallery/filter-dialog/stats-section";
import { SymbolsPickerPanel } from "@/components/gallery/filter-dialog/symbols-picker-panel";
import type { CardFilters } from "@/providers/UIStateProvider";
import { cn } from "@/lib/utils";

type QuickFilterTriggerProps = {
  label: string;
  count: number;
} & Omit<ComponentPropsWithoutRef<typeof Button>, "children">;

const QuickFilterTrigger = forwardRef<HTMLButtonElement, QuickFilterTriggerProps>(
  function QuickFilterTrigger({ label, count, className, ...props }, ref) {
    return (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 min-w-[5.5rem] max-w-[10rem] gap-1 px-2 text-[11px] font-sans font-normal normal-case tracking-normal",
          count > 0 && "border-primary/45 ring-1 ring-primary/20",
          className
        )}
        {...props}
      >
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        {count > 0 ? (
          <Badge variant="secondary" className="h-4 min-w-4 shrink-0 px-1 text-[9px] tabular-nums">
            {count}
          </Badge>
        ) : null}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </Button>
    );
  }
);

function formatTypeRarityCount(
  filters: CardFilters,
  defaultFormatKey: string
): number {
  let n = 0;
  if (filters.format !== defaultFormatKey) n += 1;
  n += filters.type?.length ?? 0;
  n += filters.rarity?.length ?? 0;
  return n;
}

function statsFilterCount(filters: CardFilters): number {
  let n = 0;
  const statKeys = [
    "difficulty",
    "control",
    "speed",
    "damage",
    "blockModifier",
    "handSize",
    "health",
    "stamina",
  ] as const;
  for (const k of statKeys) {
    const v = filters[k];
    if (v && typeof v === "object" && "value" in v && v.value !== undefined) n += 1;
  }
  n += filters.blockZone?.length ?? 0;
  n += filters.attackZone?.length ?? 0;
  return n;
}

function FormatTypeRarityQuickFilter() {
  const { filters, meta } = useGalleryFilterDialogContext();
  const count = formatTypeRarityCount(filters, meta.defaultFormatKey);

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <QuickFilterTrigger label="Format & type" count={count} />
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "z-[200] w-[min(100vw-1.5rem,24rem)] border-border/50 p-3 shadow-lg"
        )}
        align="start"
        sideOffset={6}
      >
        <FormatTypeRaritySection />
      </PopoverContent>
    </Popover>
  );
}

function SymbolsQuickFilter() {
  const { filters, meta, toggleStringFilter, setBooleanFilter } =
    useGalleryFilterDialogContext();
  const selectedSymbols = filters.symbols ?? [];
  const allSymbols = meta.uniqueValues?.symbols ?? [];
  const standardSymbols = allSymbols.filter(
    (symbol) => !symbol.startsWith("attuned:") && symbol !== "infinity"
  );
  const attunedSymbols = allSymbols.filter((symbol) => symbol.startsWith("attuned:"));

  const onInfinityChange = (checked: boolean) => {
    const hasInfinity = selectedSymbols.includes("infinity");
    if ((checked && !hasInfinity) || (!checked && hasInfinity)) {
      toggleStringFilter("symbols", "infinity");
    }
  };

  const count = selectedSymbols.length;

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <QuickFilterTrigger label="Symbols" count={count} />
      </PopoverTrigger>
      <PopoverContent
        className={cn("z-[200] w-[min(100vw-1.5rem,28rem)] border-border/50 p-3 shadow-lg")}
        align="start"
        sideOffset={6}
      >
        <span className="mb-2 block text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Symbols
        </span>
        <SymbolsPickerPanel
          selectedSymbols={selectedSymbols}
          standardSymbols={standardSymbols}
          attunedSymbols={attunedSymbols}
          symbolMatchAll={filters.symbolMatchAll ?? false}
          onToggleSymbol={(symbol) => toggleStringFilter("symbols", symbol)}
          onInfinityChange={onInfinityChange}
          onSymbolMatchAllChange={(checked) => setBooleanFilter("symbolMatchAll", checked)}
        />
      </PopoverContent>
    </Popover>
  );
}

function KeywordsQuickFilter() {
  const { filters, meta, toggleStringFilter, setBooleanFilter } =
    useGalleryFilterDialogContext();

  const count = filters.keywords?.length ?? 0;

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <QuickFilterTrigger label="Keywords" count={count} />
      </PopoverTrigger>
      <PopoverContent
        className={cn("z-[200] w-[min(100vw-1.5rem,36rem)] border-border/50 p-3 shadow-lg")}
        align="start"
        sideOffset={6}
      >
        <KeywordsPickerPanel
          keywords={meta.uniqueValues?.keywords ?? []}
          selectedKeywords={filters.keywords ?? []}
          keywordMatchAll={filters.keywordMatchAll ?? false}
          onToggleKeyword={(keyword) => toggleStringFilter("keywords", keyword)}
          onKeywordMatchAllChange={(checked) => setBooleanFilter("keywordMatchAll", checked)}
        />
      </PopoverContent>
    </Popover>
  );
}

function SetQuickFilter() {
  const { filters } = useGalleryFilterDialogContext();
  const count = filters.set?.length ?? 0;

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <QuickFilterTrigger label="Set" count={count} />
      </PopoverTrigger>
      <PopoverContent
        className={cn("z-[200] w-[min(100vw-1.5rem,22rem)] border-border/50 p-3 shadow-lg")}
        align="start"
        sideOffset={6}
      >
        <SetSection />
      </PopoverContent>
    </Popover>
  );
}

function StatsQuickFilter() {
  const { filters } = useGalleryFilterDialogContext();
  const count = statsFilterCount(filters);

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <QuickFilterTrigger label="Stats" count={count} />
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "z-[200] max-h-[min(70vh,32rem)] w-[min(100vw-1.5rem,34rem)] overflow-y-auto border-border/50 p-3 shadow-lg"
        )}
        align="start"
        sideOffset={6}
      >
        <StatsSection />
      </PopoverContent>
    </Popover>
  );
}

export function GalleryQuickFiltersRow() {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5">
      <FormatTypeRarityQuickFilter />
      <SymbolsQuickFilter />
      <KeywordsQuickFilter />
      <SetQuickFilter />
      <StatsQuickFilter />
    </div>
  );
}
