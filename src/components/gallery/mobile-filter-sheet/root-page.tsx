"use client";

import Image from "next/image";
import { LayoutGrid, List } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { rarityFilterSelected, toggleCanonicalRarityFilter } from "@/lib/universus/rarity";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";
import { useGalleryTopBarFiltersContext } from "../gallery-top-bar-filters/context";
import { useGalleryMobileFilterNav } from "./context";
import {
  ActiveFilterChip,
  FilterChip,
  FilterChipRow,
  FilterDrillRow,
  FilterGroup,
  FilterRow,
} from "./primitives";
import { STAT_KEYS, useActiveChips } from "./use-active-chips";

const segmentedItemClassName = "h-10 text-[13px] normal-case tracking-normal";

function ActiveChipsStrip() {
  const chips = useActiveChips();
  const { actions } = useGalleryFilterDialogContext();

  if (chips.length === 0) return null;

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => (
        <ActiveFilterChip key={chip.id} label={chip.label} onRemove={chip.remove} />
      ))}
      <button
        type="button"
        onClick={actions.clearAllFilters}
        className="inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </button>
    </div>
  );
}

function SearchGroup() {
  const { state, actions } = useGalleryFilterDialogContext();

  return (
    <FilterGroup label="Search in">
      <FilterRow>
        <SegmentedControl
          stretch
          size="sm"
          className="w-full bg-muted/30"
          itemClassName={segmentedItemClassName}
          value={state.searchMode}
          onValueChange={(value) => actions.setSearchMode(value as "name" | "text" | "all")}
          items={[
            { value: "all", label: "Everything" },
            { value: "name", label: "Name" },
            { value: "text", label: "Card text" },
          ]}
        />
      </FilterRow>
    </FilterGroup>
  );
}

function CardGroup() {
  const { filters, meta, toggleFormat, toggleStringFilter, actions } = useGalleryFilterDialogContext();
  const activeFormat = filters.format ?? meta.formats[0]?.key;
  const types = meta.uniqueValues?.types ?? [];
  const rarities = meta.uniqueValues?.rarities ?? [];

  return (
    <FilterGroup label="Card">
      {meta.formats.length > 0 ? (
        <FilterRow>
          <p className="mb-2 text-xs text-muted-foreground">Format</p>
          <FilterChipRow>
            {meta.formats.map((format) => (
              <FilterChip
                key={format.key}
                label={format.name}
                selected={activeFormat === format.key}
                onClick={() => {
                  if (activeFormat === format.key) return;
                  toggleFormat(format.key);
                }}
              />
            ))}
          </FilterChipRow>
        </FilterRow>
      ) : null}
      {types.length > 0 ? (
        <FilterRow>
          <p className="mb-2 text-xs text-muted-foreground">Type</p>
          <FilterChipRow>
            {types.map((type) => (
              <FilterChip
                key={type}
                label={type}
                selected={filters.type?.includes(type) ?? false}
                onClick={() => toggleStringFilter("type", type)}
              />
            ))}
          </FilterChipRow>
        </FilterRow>
      ) : null}
      {rarities.length > 0 ? (
        <FilterRow>
          <p className="mb-2 text-xs text-muted-foreground">Rarity</p>
          <FilterChipRow>
            {rarities.map((rarity) => (
              <FilterChip
                key={rarity}
                label={rarity}
                selected={rarityFilterSelected(filters.rarity, rarity)}
                onClick={() => actions.updateFilter("rarity", toggleCanonicalRarityFilter(filters.rarity, rarity))}
              />
            ))}
          </FilterChipRow>
        </FilterRow>
      ) : null}
    </FilterGroup>
  );
}

function SymbolTile({
  symbol,
  selected,
  shape,
  onClick,
}: {
  symbol: string;
  selected: boolean;
  shape: "circle" | "square";
  onClick: () => void;
}) {
  const path = getSymbolPath(symbol);
  const label = symbol.startsWith("attuned:") ? symbol.slice("attuned:".length) : symbol;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        "relative flex size-11 items-center justify-center overflow-hidden border bg-background transition-[transform,box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-90",
        shape === "circle" ? "rounded-full" : "rounded-md",
        selected
          ? "border-primary ring-2 ring-primary/60 ring-offset-2 ring-offset-background shadow-[var(--chrome-filter-tile-shadow-selected)]"
          : "border-border/50 hover:border-primary/40"
      )}
    >
      {path ? (
        <Image src={path} alt="" width={44} height={44} className="size-full object-contain p-1" />
      ) : (
        <span className="text-[10px]">{label}</span>
      )}
    </button>
  );
}

function SymbolsGroup() {
  const { filters, meta, toggleStringFilter, setBooleanFilter, setIncludeInfinityResults } =
    useGalleryFilterDialogContext();
  const selected = filters.symbols ?? [];
  const all = meta.uniqueValues?.symbols ?? [];
  const standard = all.filter((symbol) => !symbol.startsWith("attuned:") && symbol !== "infinity");
  const attuned = all.filter((symbol) => symbol.startsWith("attuned:"));

  if (all.length === 0) return null;

  return (
    <FilterGroup
      label="Symbols"
      trailing={
        <>
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Switch
              checked={filters.includeInfinity !== false}
              onCheckedChange={setIncludeInfinityResults}
              aria-label="Include Infinity"
            />
            Infinity
          </Label>
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Switch
              checked={filters.symbolMatchAll ?? false}
              onCheckedChange={(checked) => setBooleanFilter("symbolMatchAll", checked)}
              aria-label="Match all symbols"
            />
            All
          </Label>
        </>
      }
    >
      <FilterRow>
        <div className="grid grid-cols-6 justify-items-center gap-y-3">
          {standard.map((symbol) => (
            <SymbolTile
              key={symbol}
              symbol={symbol}
              shape="circle"
              selected={selected.includes(symbol)}
              onClick={() => toggleStringFilter("symbols", symbol)}
            />
          ))}
        </div>
      </FilterRow>
      {attuned.length > 0 ? (
        <FilterRow>
          <p className="mb-2 text-xs text-muted-foreground">Attuned</p>
          <div className="grid grid-cols-6 justify-items-center gap-y-3">
            {attuned.map((symbol) => (
              <SymbolTile
                key={symbol}
                symbol={symbol}
                shape="square"
                selected={selected.includes(symbol)}
                onClick={() => toggleStringFilter("symbols", symbol)}
              />
            ))}
          </div>
        </FilterRow>
      ) : null}
    </FilterGroup>
  );
}

function summarize(count: number, noun: string) {
  if (count === 0) return "Any";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function DrillGroup() {
  const { filters } = useGalleryFilterDialogContext();
  const { push } = useGalleryMobileFilterNav();
  const setCount = filters.set?.length ?? 0;
  const keywordCount = filters.keywords?.length ?? 0;
  const statCount =
    STAT_KEYS.filter((key) => filters[key]?.value !== undefined).length +
    (filters.blockZone?.length ?? 0) +
    (filters.attackZone?.length ?? 0);

  return (
    <FilterGroup label="More">
      <FilterDrillRow label="Sets" value={summarize(setCount, "set")} count={setCount} onClick={() => push("sets")} />
      <FilterDrillRow
        label="Keywords"
        value={summarize(keywordCount, "keyword")}
        count={keywordCount}
        onClick={() => push("keywords")}
      />
      <FilterDrillRow label="Stats" value={summarize(statCount, "rule")} count={statCount} onClick={() => push("stats")} />
    </FilterGroup>
  );
}

function DisplayGroup() {
  const { state, actions } = useGalleryTopBarFiltersContext();
  const mode = state.viewMode === "details" ? "list" : state.viewMode;

  return (
    <FilterGroup label="Display">
      <FilterRow className="flex items-center gap-3">
        <SegmentedControl
          stretch
          size="sm"
          className="min-w-0 flex-1 bg-muted/30"
          itemClassName={segmentedItemClassName}
          value={mode}
          onValueChange={(value) => actions.setViewMode(value as "card" | "list")}
          items={[
            { value: "card", label: "Cards", icon: LayoutGrid },
            { value: "list", label: "List", icon: List },
          ]}
        />
        {mode === "card" ? (
          <SegmentedControl
            size="sm"
            className="shrink-0 bg-muted/30"
            itemClassName={cn(segmentedItemClassName, "w-11 px-0")}
            value={String(state.cardsPerRow)}
            onValueChange={(value) => actions.setCardsPerRow(Number(value))}
            items={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
            ]}
          />
        ) : null}
      </FilterRow>
    </FilterGroup>
  );
}

export function GalleryMobileFilterRootPage() {
  return (
    <div className="space-y-5 px-4 pb-4 pt-3">
      <ActiveChipsStrip />
      <SearchGroup />
      <CardGroup />
      <SymbolsGroup />
      <DrillGroup />
      <DisplayGroup />
    </div>
  );
}
