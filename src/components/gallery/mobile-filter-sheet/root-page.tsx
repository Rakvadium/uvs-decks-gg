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
import { useGalleryMobileFilterDisplayOverride, type GalleryMobileFilterDisplayMode } from "./display-context";
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
const compactChipClassName = "h-7 gap-1 px-2.5 text-xs";
const compactChipRowClassName = "gap-1.5";

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

function IncludeBannedToggle() {
  const { filters, actions } = useGalleryFilterDialogContext();

  return (
    <Label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
      <Switch
        checked={filters.includeBanned === true}
        onCheckedChange={(checked) => actions.updateFilter("includeBanned", checked ? true : undefined)}
        aria-label="Include banned cards"
      />
      Include banned
    </Label>
  );
}

function FormatRows({
  compact = false,
  bannedPlacement = "below",
  heading = true,
}: {
  compact?: boolean;
  bannedPlacement?: "below" | "end" | "none";
  heading?: boolean;
}) {
  const { filters, meta, toggleFormat } = useGalleryFilterDialogContext();
  const activeFormat = filters.format ?? meta.formats[0]?.key;

  if (meta.formats.length === 0) return null;

  return (
    <FilterRow className={compact ? "py-2" : undefined}>
      {heading || bannedPlacement === "end" ? (
        <div
          className={cn(
            "mb-2 flex items-center gap-3",
            compact && "mb-1.5",
            heading && bannedPlacement === "end" && "justify-between",
            !heading && bannedPlacement === "end" && "justify-end"
          )}
        >
          {heading ? <p className="text-xs text-muted-foreground">Format</p> : null}
          {bannedPlacement === "end" ? <IncludeBannedToggle /> : null}
        </div>
      ) : null}
      <FilterChipRow className={compact ? compactChipRowClassName : undefined}>
        {meta.formats.map((format) => (
          <FilterChip
            key={format.key}
            label={format.name}
            selected={activeFormat === format.key}
            className={compact ? compactChipClassName : undefined}
            onClick={() => {
              if (activeFormat === format.key) return;
              toggleFormat(format.key);
            }}
          />
        ))}
      </FilterChipRow>
      {bannedPlacement === "below" ? (
        <div className={cn("mt-3", compact && "mt-2")}>
          <IncludeBannedToggle />
        </div>
      ) : null}
    </FilterRow>
  );
}

function TypeRows({
  compact = false,
  heading = true,
}: {
  compact?: boolean;
  heading?: boolean;
}) {
  const { filters, meta, toggleStringFilter } = useGalleryFilterDialogContext();
  const types = meta.uniqueValues?.types ?? [];

  if (types.length === 0) return null;

  return (
    <FilterRow className={compact ? "py-2" : undefined}>
      {heading ? <p className={cn("mb-2 text-xs text-muted-foreground", compact && "mb-1.5")}>Type</p> : null}
      <FilterChipRow className={compact ? compactChipRowClassName : undefined}>
        {types.map((type) => (
          <FilterChip
            key={type}
            label={type}
            selected={filters.type?.includes(type) ?? false}
            className={compact ? compactChipClassName : undefined}
            onClick={() => toggleStringFilter("type", type)}
          />
        ))}
      </FilterChipRow>
    </FilterRow>
  );
}

function RarityRows({
  compact = false,
  heading = !compact,
}: {
  compact?: boolean;
  heading?: boolean;
}) {
  const { filters, meta, actions } = useGalleryFilterDialogContext();
  const rarities = meta.uniqueValues?.rarities ?? [];

  if (rarities.length === 0) return null;

  return (
    <FilterRow className={compact ? "py-2" : undefined}>
      {heading ? <p className={cn("mb-2 text-xs text-muted-foreground", compact && "mb-1.5")}>Rarity</p> : null}
      <FilterChipRow className={compact ? compactChipRowClassName : undefined}>
        {rarities.map((rarity) => (
          <FilterChip
            key={rarity}
            label={rarity}
            selected={rarityFilterSelected(filters.rarity, rarity)}
            className={compact ? compactChipClassName : undefined}
            onClick={() => actions.updateFilter("rarity", toggleCanonicalRarityFilter(filters.rarity, rarity))}
          />
        ))}
      </FilterChipRow>
    </FilterRow>
  );
}

function selectionLabel(count: number) {
  if (count === 0) return "Any";
  return count === 1 ? "1 selected" : `${count} selected`;
}

function MobileFilterIndex() {
  const { filters, meta } = useGalleryFilterDialogContext();
  const { push } = useGalleryMobileFilterNav();
  const setCount = filters.set?.length ?? 0;
  const typeCount = filters.type?.length ?? 0;
  const symbolCount = filters.symbols?.length ?? 0;
  const keywordCount = filters.keywords?.length ?? 0;
  const statCount =
    STAT_KEYS.filter((key) => filters[key]?.value !== undefined).length +
    (filters.blockZone?.length ?? 0) +
    (filters.attackZone?.length ?? 0);
  const rarityCount = filters.rarity?.length ?? 0;
  const formatName = meta.formats.find((format) => format.key === (filters.format ?? meta.formats[0]?.key))?.name ?? "Any";

  return (
    <FilterGroup>
      <FilterDrillRow label="Format" value={formatName} count={formatName === "Any" ? 0 : 1} onClick={() => push("format")} />
      <FilterDrillRow label="Sets" value={selectionLabel(setCount)} count={setCount} onClick={() => push("sets")} />
      <FilterDrillRow label="Type" value={selectionLabel(typeCount)} count={typeCount} onClick={() => push("type")} />
      <FilterDrillRow label="Symbols" value={selectionLabel(symbolCount)} count={symbolCount} onClick={() => push("symbols")} />
      <FilterDrillRow label="Keywords" value={selectionLabel(keywordCount)} count={keywordCount} onClick={() => push("keywords")} />
      <FilterDrillRow label="Stats" value={selectionLabel(statCount)} count={statCount} onClick={() => push("stats")} />
      <FilterDrillRow label="Rarity" value={selectionLabel(rarityCount)} count={rarityCount} onClick={() => push("rarity")} />
    </FilterGroup>
  );
}

function SymbolTile({
  symbol,
  selected,
  shape,
  onClick,
  size = "md",
}: {
  symbol: string;
  selected: boolean;
  shape: "circle" | "square";
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const path = getSymbolPath(symbol);
  const label = symbol.startsWith("attuned:") ? symbol.slice("attuned:".length) : symbol;
  const px = size === "sm" ? 32 : size === "md" ? 40 : 44;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        "relative flex items-center justify-center overflow-hidden border bg-background transition-[transform,box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-90",
        size === "sm" ? "size-8" : size === "md" ? "size-10" : "size-11",
        shape === "circle" ? "rounded-full" : "rounded-md",
        selected
          ? "border-primary ring-2 ring-primary/60 ring-offset-background shadow-[var(--chrome-filter-tile-shadow-selected)]"
          : "border-border/50 hover:border-primary/40",
        selected && (size === "lg" ? "ring-offset-2" : "ring-offset-1")
      )}
    >
      {path ? (
        <Image src={path} alt="" width={px} height={px} className="size-full object-contain p-1" />
      ) : (
        <span className="text-[10px]">{label}</span>
      )}
    </button>
  );
}

function SymbolGrid({
  symbols,
  selected,
  shape,
  size = "lg",
  layout = "grid",
  onToggle,
}: {
  symbols: string[];
  selected: string[];
  shape: "circle" | "square";
  size?: "sm" | "md" | "lg";
  layout?: "grid" | "wrap";
  onToggle: (symbol: string) => void;
}) {
  return (
    <div
      className={cn(
        layout === "wrap"
          ? "flex flex-wrap justify-start gap-2"
          : cn(
              "grid grid-cols-6 justify-items-center",
              size === "sm" ? "w-full gap-y-1" : "mx-auto w-full max-w-sm gap-y-3"
            )
      )}
    >
      {symbols.map((symbol) => (
        <SymbolTile
          key={symbol}
          symbol={symbol}
          shape={shape}
          size={size}
          selected={selected.includes(symbol)}
          onClick={() => onToggle(symbol)}
        />
      ))}
    </div>
  );
}

function SymbolsGroup({
  compact = false,
  spread = false,
  showSwitches = true,
}: {
  compact?: boolean;
  spread?: boolean;
  showSwitches?: boolean;
}) {
  const { filters, meta, toggleStringFilter, setBooleanFilter, setIncludeInfinityResults } =
    useGalleryFilterDialogContext();
  const selected = filters.symbols ?? [];
  const all = meta.uniqueValues?.symbols ?? [];
  const standard = all.filter((symbol) => !symbol.startsWith("attuned:") && symbol !== "infinity");
  const attuned = all.filter((symbol) => symbol.startsWith("attuned:"));

  if (all.length === 0) return null;

  const toggle = (symbol: string) => toggleStringFilter("symbols", symbol);

  const symbolSwitches = (
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
  );

  const embedded = compact || spread;

  return (
    <FilterGroup label={embedded ? undefined : "Symbols"} trailing={embedded || !showSwitches ? undefined : symbolSwitches}>
      {embedded ? (
        <FilterRow className="space-y-2 py-2">
          {showSwitches ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Standard</p>
              <div className="flex shrink-0 items-center gap-x-3">{symbolSwitches}</div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Standard</p>
          )}
          <SymbolGrid
            symbols={standard}
            selected={selected}
            shape="circle"
            size={spread ? "md" : "sm"}
            layout={spread ? "wrap" : "grid"}
            onToggle={toggle}
          />
          {attuned.length > 0 ? (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Attuned</p>
              <SymbolGrid
                symbols={attuned}
                selected={selected}
                shape="square"
                size={spread ? "md" : "sm"}
                layout={spread ? "wrap" : "grid"}
                onToggle={toggle}
              />
            </div>
          ) : null}
        </FilterRow>
      ) : (
        <>
          <FilterRow>
            <SymbolGrid
              symbols={standard}
              selected={selected}
              shape="circle"
              onToggle={toggle}
            />
          </FilterRow>
          {attuned.length > 0 ? (
            <FilterRow>
              <p className="mb-2 text-xs text-muted-foreground">Attuned</p>
              <SymbolGrid
                symbols={attuned}
                selected={selected}
                shape="square"
                onToggle={toggle}
              />
            </FilterRow>
          ) : null}
        </>
      )}
    </FilterGroup>
  );
}

function summarize(count: number, noun: string) {
  if (count === 0) return "Any";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function raritySummary(selected: string[] | undefined) {
  if (!selected || selected.length === 0) return "Any";
  return selected.join(", ");
}

function DrillGroup({ compact = false }: { compact?: boolean }) {
  const { filters, meta } = useGalleryFilterDialogContext();
  const { push } = useGalleryMobileFilterNav();
  const setCount = filters.set?.length ?? 0;
  const typeCount = filters.type?.length ?? 0;
  const symbolCount = filters.symbols?.length ?? 0;
  const keywordCount = filters.keywords?.length ?? 0;
  const statCount =
    STAT_KEYS.filter((key) => filters[key]?.value !== undefined).length +
    (filters.blockZone?.length ?? 0) +
    (filters.attackZone?.length ?? 0);
  const rarityCount = filters.rarity?.length ?? 0;
  const rowClassName = compact ? "min-h-10" : undefined;
  const defaultFormat = meta.formats[0]?.key;
  const activeFormat = filters.format ?? defaultFormat;
  const formatName = meta.formats.find((format) => format.key === activeFormat)?.name ?? "Any";
  const formatValue = filters.includeBanned ? `${formatName} · banned` : formatName;
  const formatCount =
    (filters.format && filters.format !== defaultFormat ? 1 : 0) + (filters.includeBanned ? 1 : 0);

  return (
    <FilterGroup label={compact ? undefined : "More"}>
      {compact ? (
        <FilterDrillRow
          label="Format"
          value={formatValue}
          count={formatCount}
          className={rowClassName}
          onClick={() => push("format")}
        />
      ) : null}
      <FilterDrillRow
        label="Sets"
        value={summarize(setCount, "set")}
        count={setCount}
        className={rowClassName}
        onClick={() => push("sets")}
      />
      {compact ? (
        <FilterDrillRow
          label="Type"
          value={typeCount > 0 ? (filters.type ?? []).join(", ") : "Any"}
          count={typeCount}
          className={rowClassName}
          onClick={() => push("type")}
        />
      ) : null}
      {compact ? (
        <FilterDrillRow
          label="Symbols"
          value={summarize(symbolCount, "symbol")}
          count={symbolCount}
          className={rowClassName}
          onClick={() => push("symbols")}
        />
      ) : null}
      <FilterDrillRow
        label="Keywords"
        value={summarize(keywordCount, "keyword")}
        count={keywordCount}
        className={rowClassName}
        onClick={() => push("keywords")}
      />
      <FilterDrillRow
        label="Stats"
        value={summarize(statCount, "rule")}
        count={statCount}
        className={rowClassName}
        onClick={() => push("stats")}
      />
      {compact ? (
        <FilterDrillRow
          label="Rarity"
          value={raritySummary(filters.rarity)}
          count={rarityCount}
          className={rowClassName}
          onClick={() => push("rarity")}
        />
      ) : null}
    </FilterGroup>
  );
}

function DisplayGroup() {
  const { state, actions } = useGalleryTopBarFiltersContext();
  const override = useGalleryMobileFilterDisplayOverride();
  const galleryMode: GalleryMobileFilterDisplayMode = state.viewMode === "details" ? "list" : state.viewMode;
  const mode = override ? override.viewMode : galleryMode;
  const setMode = override ? override.setViewMode : actions.setViewMode;

  return (
    <FilterGroup label="Display">
      <FilterRow className="flex items-center gap-3">
        <SegmentedControl
          stretch
          size="sm"
          className="min-w-0 flex-1 bg-muted/30"
          itemClassName={segmentedItemClassName}
          value={mode}
          onValueChange={(value) => setMode(value as GalleryMobileFilterDisplayMode)}
          items={[
            { value: "card", label: "Cards", icon: LayoutGrid },
            { value: "list", label: "List", icon: List },
          ]}
        />
        {!override && mode === "card" ? (
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
      <MobileFilterIndex />
      <SearchGroup />
      <DisplayGroup />
    </div>
  );
}

export function GalleryDesktopFilterRootPage() {
  return (
    <div className="space-y-4 px-4 pb-4 pt-3">
      <ActiveChipsStrip />
      <DrillGroup compact />
    </div>
  );
}

export function GalleryMobileFilterFormatPage() {
  return (
    <div className="px-4 pb-4 pt-3">
      <FilterGroup>
        <FormatRows heading={false} />
      </FilterGroup>
    </div>
  );
}

export function GalleryMobileFilterTypePage() {
  return (
    <div className="px-4 pb-4 pt-3">
      <FilterGroup>
        <TypeRows heading={false} />
      </FilterGroup>
    </div>
  );
}

export function GalleryMobileFilterSymbolsPage() {
  return (
    <div className="px-4 pb-4 pt-3">
      <SymbolsGroup />
    </div>
  );
}

export function GalleryDesktopFilterFormatPage() {
  return (
    <div className="px-4 pb-4 pt-3">
      <FilterGroup>
        <FormatRows compact bannedPlacement="none" heading={false} />
      </FilterGroup>
    </div>
  );
}

export function GalleryDesktopFilterTypePage() {
  return (
    <div className="px-4 pb-4 pt-3">
      <FilterGroup>
        <TypeRows compact heading={false} />
      </FilterGroup>
    </div>
  );
}

export function GalleryDesktopFilterSymbolsPage() {
  return (
    <div className="px-4 pb-4 pt-3">
      <SymbolsGroup spread showSwitches={false} />
    </div>
  );
}

export function GalleryFilterRarityPage() {
  return (
    <div className="px-4 pb-4 pt-3">
      <FilterGroup>
        <RarityRows heading={false} />
      </FilterGroup>
    </div>
  );
}
