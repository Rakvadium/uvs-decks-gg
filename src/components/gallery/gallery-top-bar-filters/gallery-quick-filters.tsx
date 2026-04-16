"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import Image from "next/image";
import { ChevronDown, FilterX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import { FormatRow } from "@/components/gallery/filter-dialog/format-type-rarity-section/format-row";
// import { RarityRow } from "@/components/gallery/filter-dialog/format-type-rarity-section/rarity-row";
import { TypeRow } from "@/components/gallery/filter-dialog/format-type-rarity-section/type-row";
import { KeywordsPickerPanel } from "@/components/gallery/filter-dialog/keywords-picker-panel";
import { SetSection } from "@/components/gallery/filter-dialog/set-section";
import { StatsSection } from "@/components/gallery/filter-dialog/stats-section";
import { StatsQuickFilterAdornment } from "./stats-quick-filter-adornment";
import { SymbolsPickerPanel } from "@/components/gallery/filter-dialog/symbols-picker-panel";
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { getCardTypeChipColor, getKeywordTimingColor } from "@/config/universus";
import type { CardFilters } from "@/providers/UIStateProvider";
import { galleryToolbarControlClassName } from "@/components/ui/gallery-search-field";
import { cn } from "@/lib/utils";

const quickFilterValueChipClassName =
  "inline-flex max-w-[5.5rem] shrink-0 items-center truncate rounded-sm px-1.5 py-px text-[9px] font-bold font-mono uppercase tracking-[0.1em]";

const quickFilterPopoverClass =
  "z-[200] border-border/50 p-3 shadow-lg outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";

type QuickFilterTriggerProps = {
  label: string;
  count: number;
  endAdornment?: ReactNode;
  split?: boolean;
} & Omit<ComponentPropsWithoutRef<typeof Button>, "children">;

const STATS_GALLERY_FILTER_KEYS = [
  "difficulty",
  "control",
  "speed",
  "damage",
  "blockModifier",
  "handSize",
  "health",
  "stamina",
  "blockZone",
  "attackZone",
] as const satisfies readonly (keyof CardFilters)[];

function QuickFilterSymbolAdornment({ symbols }: { symbols: string[] }) {
  if (symbols.length === 0) return null;

  return (
    <span className="flex shrink-0 flex-nowrap items-center gap-0.5">
      {symbols.map((symbol) => {
        const path = getSymbolPath(symbol);
        const isAttuned = symbol.startsWith("attuned:");

        return (
          <span
            key={symbol}
            className={cn(
              "relative flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden border border-border/50 bg-background",
              isAttuned ? "rounded-none" : "rounded-full"
            )}
          >
            {path ? (
              <Image
                src={path}
                alt={symbol}
                width={20}
                height={20}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="max-w-full truncate px-0.5 text-[7px] leading-none text-muted-foreground">
                {symbol}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function QuickFilterTextAdornment({
  values,
  maxVisible = 2,
}: {
  values: string[];
  maxVisible?: number;
}) {
  if (values.length === 0) return null;
  const shown = values.slice(0, maxVisible);
  const rest = values.length - shown.length;
  const text = shown.join(", ");

  return (
    <span
      className="max-w-[5.5rem] shrink-0 truncate text-[10px] font-normal normal-case tracking-normal text-primary"
      title={values.join(", ")}
    >
      {text}
      {rest > 0 ? ` +${rest}` : ""}
    </span>
  );
}

function QuickFilterTypeChipAdornment({ types }: { types: string[] }) {
  if (types.length === 0) return null;

  return (
    <span className="flex shrink-0 flex-nowrap items-center gap-0.5">
      {types.map((type) => {
        const color = getCardTypeChipColor(type);

        return (
          <span
            key={type}
            className={quickFilterValueChipClassName}
            title={type}
            style={{
              backgroundColor: `${color}20`,
              color,
              border: `1px solid ${color}40`,
            }}
          >
            {type}
          </span>
        );
      })}
    </span>
  );
}

function QuickFilterKeywordChipAdornment({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) return null;

  return (
    <span className="flex shrink-0 flex-nowrap items-center gap-0.5">
      {keywords.map((keyword) => {
        const color = getKeywordTimingColor(keyword);

        return (
          <span
            key={keyword}
            className={quickFilterValueChipClassName}
            title={keyword}
            style={{
              backgroundColor: `${color}20`,
              color,
              border: `1px solid ${color}40`,
            }}
          >
            {keyword}
          </span>
        );
      })}
    </span>
  );
}

const QuickFilterTrigger = forwardRef<HTMLButtonElement, QuickFilterTriggerProps>(
  function QuickFilterTrigger(
    { label, count, endAdornment, split = false, className, ...props },
    ref
  ) {
    const showCountBadge = count > 0 && !endAdornment;

    return (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        className={cn(
          galleryToolbarControlClassName,
          "min-w-[5.5rem] justify-start gap-1 px-4",
          split
            ? "max-w-none min-w-0 flex-1 rounded-none rounded-l-md border-0 bg-transparent shadow-none ring-0 focus-visible:z-10 !bg-transparent"
            : "max-w-[10rem]",
          endAdornment && !split && "w-max max-w-[min(96vw,48rem)]",
          endAdornment && split && "w-max min-w-0 max-w-[min(96vw,48rem)] flex-1",
          !split && count > 0 && "border-primary/45 ring-1 ring-primary/20",
          className
        )}
        {...props}
      >
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        {showCountBadge ? (
          <Badge variant="secondary" className="h-4 min-w-4 shrink-0 px-1 text-[9px] tabular-nums">
            {count}
          </Badge>
        ) : null}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        {endAdornment ? (
          <span className="flex min-w-0 max-w-[min(26rem,72vw)] shrink flex-wrap items-center gap-x-1 gap-y-0.5 border-l border-border/50 pl-2">
            {endAdornment}
          </span>
        ) : null}
      </Button>
    );
  }
);

function QuickFilterClearControl({
  ariaLabel,
  onClear,
}: {
  ariaLabel: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-9 w-8 shrink-0 items-center justify-center rounded-none rounded-r-md border-0 border-l border-border/50 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClear();
      }}
    >
      <X className="size-3.5 shrink-0 opacity-80" />
    </button>
  );
}

function QuickFilterTriggerWrap({
  count,
  clearAriaLabel,
  onClear,
  children,
}: {
  count: number;
  clearAriaLabel: string;
  onClear: () => void;
  children: ReactNode;
}) {
  const showClear = count > 0;

  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-stretch",
        showClear &&
          "h-9 max-w-[min(96vw,48rem)] overflow-hidden rounded-md border border-primary/40 bg-background/50 shadow-[var(--chrome-search-field-shadow)] ring-1 ring-primary/20"
      )}
    >
      {children}
      {showClear ? <QuickFilterClearControl ariaLabel={clearAriaLabel} onClear={onClear} /> : null}
    </div>
  );
}

function formatOnlyCount(filters: CardFilters, defaultFormatKey: string): number {
  return filters.format !== defaultFormatKey ? 1 : 0;
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

export function FormatQuickFilter() {
  const { filters, meta, actions } = useGalleryFilterDialogContext();
  const count = formatOnlyCount(filters, meta.defaultFormatKey);
  const formatLabel = meta.formats.find((f) => f.key === filters.format)?.name;
  const endAdornment =
    count > 0 && formatLabel ? (
      <span className="max-w-[4.5rem] shrink-0 truncate text-[10px] font-normal normal-case tracking-normal text-primary">
        {formatLabel}
      </span>
    ) : undefined;

  return (
    <Popover modal={false}>
      <QuickFilterTriggerWrap
        count={count}
        clearAriaLabel="Clear format filter"
        onClear={() => actions.removeFilterKeys(["format"])}
      >
        <PopoverTrigger asChild>
          <QuickFilterTrigger
            label="Format"
            count={count}
            endAdornment={endAdornment}
            split={count > 0}
          />
        </PopoverTrigger>
      </QuickFilterTriggerWrap>
      <PopoverContent
        className={cn(quickFilterPopoverClass)}
        align="start"
        sideOffset={6}
      >
        <FormatRow />
      </PopoverContent>
    </Popover>
  );
}

function TypeQuickFilter() {
  const { filters, actions } = useGalleryFilterDialogContext();
  const types = filters.type ?? [];
  const count = types.length;
  const endAdornment = types.length > 0 ? <QuickFilterTypeChipAdornment types={types} /> : undefined;

  return (
    <Popover modal={false}>
      <QuickFilterTriggerWrap
        count={count}
        clearAriaLabel="Clear type filter"
        onClear={() => actions.removeFilterKeys(["type"])}
      >
        <PopoverTrigger asChild>
          <QuickFilterTrigger
            label="Type"
            count={count}
            endAdornment={endAdornment}
            split={count > 0}
          />
        </PopoverTrigger>
      </QuickFilterTriggerWrap>
      <PopoverContent
        className={cn(quickFilterPopoverClass)}
        align="start"
        sideOffset={6}
      >
        <TypeRow hideLabel />
      </PopoverContent>
    </Popover>
  );
}

// function RarityQuickFilter() {
//   const { filters } = useGalleryFilterDialogContext();
//   const rarities = filters.rarity ?? [];
//   const count = rarities.length;
//   const endAdornment =
//     rarities.length > 0 ? <QuickFilterTextAdornment values={rarities} maxVisible={2} /> : undefined;
//
//   return (
//     <Popover modal={false}>
//       <PopoverTrigger asChild>
//         <QuickFilterTrigger label="Rarity" count={count} endAdornment={endAdornment} />
//       </PopoverTrigger>
//       <PopoverContent
//         className={cn(quickFilterPopoverClass)}
//         align="start"
//         sideOffset={6}
//       >
//         <RarityRow hideLabel />
//       </PopoverContent>
//     </Popover>
//   );
// }

function SymbolsQuickFilter() {
  const { filters, meta, actions, toggleStringFilter, setBooleanFilter } =
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
  const endAdornment =
    selectedSymbols.length > 0 ? <QuickFilterSymbolAdornment symbols={selectedSymbols} /> : undefined;

  return (
    <Popover modal={false}>
      <QuickFilterTriggerWrap
        count={count}
        clearAriaLabel="Clear symbols filter"
        onClear={() => actions.removeFilterKeys(["symbols", "symbolMatchAll"])}
      >
        <PopoverTrigger asChild>
          <QuickFilterTrigger
            label="Symbols"
            count={count}
            endAdornment={endAdornment}
            split={count > 0}
          />
        </PopoverTrigger>
      </QuickFilterTriggerWrap>
      <PopoverContent
        className={cn(quickFilterPopoverClass)}
        align="start"
        sideOffset={6}
      >
        <SymbolsPickerPanel
          selectedSymbols={selectedSymbols}
          standardSymbols={standardSymbols}
          attunedSymbols={attunedSymbols}
          symbolMatchAll={filters.symbolMatchAll ?? false}
          onToggleSymbol={(symbol) => toggleStringFilter("symbols", symbol)}
          onInfinityChange={onInfinityChange}
          onSymbolMatchAllChange={(checked) => setBooleanFilter("symbolMatchAll", checked)}
          plain
        />
      </PopoverContent>
    </Popover>
  );
}

function KeywordsQuickFilter() {
  const { filters, meta, actions, toggleStringFilter, setBooleanFilter } =
    useGalleryFilterDialogContext();

  const keywords = filters.keywords ?? [];
  const count = keywords.length;
  const endAdornment =
    keywords.length > 0 ? <QuickFilterKeywordChipAdornment keywords={keywords} /> : undefined;

  return (
    <Popover modal={false}>
      <QuickFilterTriggerWrap
        count={count}
        clearAriaLabel="Clear keywords filter"
        onClear={() => actions.removeFilterKeys(["keywords", "keywordMatchAll"])}
      >
        <PopoverTrigger asChild>
          <QuickFilterTrigger
            label="Keywords"
            count={count}
            endAdornment={endAdornment}
            split={count > 0}
          />
        </PopoverTrigger>
      </QuickFilterTriggerWrap>
      <PopoverContent
        className={cn(quickFilterPopoverClass, "w-[min(100vw-1.5rem,36rem)]")}
        align="start"
        sideOffset={6}
      >
        <KeywordsPickerPanel
          keywords={meta.uniqueValues?.keywords ?? []}
          selectedKeywords={filters.keywords ?? []}
          keywordMatchAll={filters.keywordMatchAll ?? false}
          onToggleKeyword={(keyword) => toggleStringFilter("keywords", keyword)}
          onKeywordMatchAllChange={(checked) => setBooleanFilter("keywordMatchAll", checked)}
          plain
        />
      </PopoverContent>
    </Popover>
  );
}

export function SetQuickFilter() {
  const { filters, setOptions, actions } = useGalleryFilterDialogContext();
  const codes = filters.set ?? [];
  const count = codes.length;
  const setLabels = codes.map(
    (code) => setOptions.find((option) => option.code === code)?.name ?? code
  );
  const endAdornment =
    codes.length > 0 ? <QuickFilterTextAdornment values={setLabels} maxVisible={1} /> : undefined;

  return (
    <Popover modal={false}>
      <QuickFilterTriggerWrap
        count={count}
        clearAriaLabel="Clear set filter"
        onClear={() => actions.removeFilterKeys(["set"])}
      >
        <PopoverTrigger asChild>
          <QuickFilterTrigger
            label="Set"
            count={count}
            endAdornment={endAdornment}
            split={count > 0}
          />
        </PopoverTrigger>
      </QuickFilterTriggerWrap>
      <PopoverContent
        className={cn(quickFilterPopoverClass, "w-[min(100vw-1.5rem,22rem)]")}
        align="start"
        sideOffset={6}
      >
        <SetSection plain />
      </PopoverContent>
    </Popover>
  );
}

function StatsQuickFilter() {
  const { filters, actions } = useGalleryFilterDialogContext();
  const count = statsFilterCount(filters);
  const endAdornment = count > 0 ? <StatsQuickFilterAdornment filters={filters} /> : undefined;

  return (
    <Popover modal={false}>
      <QuickFilterTriggerWrap
        count={count}
        clearAriaLabel="Clear stats filter"
        onClear={() => actions.removeFilterKeys([...STATS_GALLERY_FILTER_KEYS])}
      >
        <PopoverTrigger asChild>
          <QuickFilterTrigger
            label="Stats"
            count={count}
            endAdornment={endAdornment}
            split={count > 0}
          />
        </PopoverTrigger>
      </QuickFilterTriggerWrap>
      <PopoverContent
        className={cn(
          quickFilterPopoverClass,
          "max-h-[min(70vh,32rem)] w-[min(100vw-1.5rem,34rem)] overflow-y-auto"
        )}
        align="start"
        sideOffset={6}
      >
        <StatsSection plain />
      </PopoverContent>
    </Popover>
  );
}

export function GalleryQuickFiltersRow() {
  const { actions } = useGalleryFilterDialogContext();

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <TypeQuickFilter />
        {/* <RarityQuickFilter /> */}
        <SymbolsQuickFilter />
        <KeywordsQuickFilter />
        <StatsQuickFilter />
      </div>
      <Button
        type="button"
        variant="outline"
        className={cn(
          galleryToolbarControlClassName,
          "shrink-0 gap-1.5 border-destructive/50 px-4 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive hover:shadow-[var(--chrome-search-field-shadow)] focus-visible:border-destructive focus-visible:ring-destructive/30"
        )}
        onClick={actions.clearAllFilters}
      >
        <FilterX className="size-4 shrink-0" />
        Clear Filters
      </Button>
    </div>
  );
}
