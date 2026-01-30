"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SymbolIcon, SymbolBadge } from "@/components/universus/symbol-icon";
import { useGalleryFilters } from "@/providers/GalleryFiltersProvider";

interface FilterOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxDisplay?: number;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  maxDisplay = 2,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const displayText = useMemo(() => {
    if (selected.length === 0) return label;
    if (selected.length <= maxDisplay) {
      return selected.join(", ");
    }
    return `${selected.slice(0, maxDisplay).join(", ")} +${selected.length - maxDisplay}`;
  }, [selected, label, maxDisplay]);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1 text-xs",
            selected.length > 0 && "border-primary"
          )}
        >
          <span className="max-w-[120px] truncate">{displayText}</span>
          {selected.length > 0 ? (
            <X
              className="h-3 w-3 shrink-0"
              role="button"
              tabIndex={0}
              aria-label="Clear filter"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e);
                }
              }}
            />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="max-h-64 overflow-y-auto space-y-1">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              onClick={() => handleToggle(option.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(option.value);
                }
              }}
              role="option"
              tabIndex={0}
              aria-selected={selected.includes(option.value)}
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  value: [number | undefined, number | undefined];
  onChange: (value: [number | undefined, number | undefined]) => void;
}

function RangeFilter({ label, min, max, value, onChange }: RangeFilterProps) {
  const [open, setOpen] = useState(false);
  const currentMin = value[0] ?? min;
  const currentMax = value[1] ?? max;
  const hasValue = value[0] !== undefined || value[1] !== undefined;

  const displayText = useMemo(() => {
    if (!hasValue) return label;
    if (currentMin === currentMax) return `${label}: ${currentMin}`;
    return `${label}: ${currentMin}-${currentMax}`;
  }, [label, hasValue, currentMin, currentMax]);

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange([undefined, undefined]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1 text-xs", hasValue && "border-primary")}
        >
          <span>{displayText}</span>
          {hasValue ? (
            <X
              className="h-3 w-3 shrink-0"
              role="button"
              tabIndex={0}
              aria-label="Clear filter"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e);
                }
              }}
            />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm text-muted-foreground">
              {currentMin} - {currentMax}
            </span>
          </div>
          <Slider
            min={min}
            max={max}
            step={1}
            value={[currentMin, currentMax]}
            onValueChange={([newMin, newMax]) => {
              onChange([
                newMin === min ? undefined : newMin,
                newMax === max ? undefined : newMax,
              ]);
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SymbolSelectFilterProps {
  symbols: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function SymbolSelectFilter({ symbols, selected, onChange }: SymbolSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (symbol: string) => {
    if (selected.includes(symbol)) {
      onChange(selected.filter((s) => s !== symbol));
    } else {
      onChange([...selected, symbol]);
    }
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1 text-xs",
            selected.length > 0 && "border-primary"
          )}
        >
          {selected.length === 0 ? (
            <>
              <span>Symbols</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </>
          ) : (
            <>
              <span className="flex items-center gap-0.5">
                {selected.slice(0, 3).map((s) => (
                  <SymbolIcon key={s} symbol={s} size="xs" />
                ))}
                {selected.length > 3 && (
                  <span className="text-[10px] ml-0.5">+{selected.length - 3}</span>
                )}
              </span>
              <X
                className="h-3 w-3 shrink-0"
                role="button"
                tabIndex={0}
                aria-label="Clear filter"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e);
                  }
                }}
              />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-6 gap-1.5">
          {symbols.map((symbol) => (
            <SymbolBadge
              key={symbol}
              symbol={symbol}
              selected={selected.includes(symbol)}
              onClick={() => handleToggle(symbol)}
              size="md"
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterPanel() {
  const { state, actions, meta } = useGalleryFilters();
  const filters = state.filters;
  const uniqueValues = meta.uniqueValues;
  const hasActiveFilters = meta.activeFilterCount > 0;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={actions.clearAllFilters}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex flex-wrap gap-1.5">
            {uniqueValues?.types.map((type) => (
              <Badge
                key={type}
                variant={filters.type?.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const current = filters.type ?? [];
                  if (current.includes(type)) {
                    actions.updateFilter(
                      "type",
                      current.filter((t) => t !== type)
                    );
                  } else {
                    actions.updateFilter("type", [...current, type]);
                  }
                }}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Rarity</Label>
          <div className="flex flex-wrap gap-1.5">
            {uniqueValues?.rarities.map((rarity) => (
              <Badge
                key={rarity}
                variant={filters.rarity?.includes(rarity) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const current = filters.rarity ?? [];
                  if (current.includes(rarity)) {
                    actions.updateFilter(
                      "rarity",
                      current.filter((r) => r !== rarity)
                    );
                  } else {
                    actions.updateFilter("rarity", [...current, rarity]);
                  }
                }}
              >
                {rarity}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Set</Label>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {uniqueValues?.setNames.map((setName) => (
              <div
                key={setName}
                className="flex items-center gap-2 py-1"
              >
                <Checkbox
                  checked={filters.set?.includes(
                    uniqueValues.setCodes[uniqueValues.setNames.indexOf(setName)]
                  )}
                  onCheckedChange={(checked) => {
                    const setCode =
                      uniqueValues.setCodes[uniqueValues.setNames.indexOf(setName)];
                    const current = filters.set ?? [];
                    if (checked) {
                      actions.updateFilter("set", [...current, setCode]);
                    } else {
                      actions.updateFilter(
                        "set",
                        current.filter((s) => s !== setCode)
                      );
                    }
                  }}
                />
                <span className="text-sm">{setName}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Symbols</Label>
          <div className="grid grid-cols-6 gap-1.5">
            {uniqueValues?.symbols.map((symbol) => (
              <SymbolBadge
                key={symbol}
                symbol={symbol}
                selected={filters.symbols?.includes(symbol)}
                onClick={() => {
                  const current = filters.symbols ?? [];
                  if (current.includes(symbol)) {
                    actions.updateFilter(
                      "symbols",
                      current.filter((s) => s !== symbol)
                    );
                  } else {
                    actions.updateFilter("symbols", [...current, symbol]);
                  }
                }}
                size="md"
              />
            ))}
          </div>
          {(filters.symbols?.length ?? 0) > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                checked={filters.symbolMatchAll ?? false}
                onCheckedChange={(checked) =>
                  actions.updateFilter("symbolMatchAll", checked ? true : undefined)
                }
              />
              <span className="text-xs text-muted-foreground">
                Match all symbols
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Keywords</Label>
          <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5">
            {uniqueValues?.keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant={filters.keywords?.includes(keyword) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => {
                  const current = filters.keywords ?? [];
                  if (current.includes(keyword)) {
                    actions.updateFilter(
                      "keywords",
                      current.filter((k) => k !== keyword)
                    );
                  } else {
                    actions.updateFilter("keywords", [...current, keyword]);
                  }
                }}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Stats</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Difficulty</span>
              <Slider
                min={0}
                max={6}
                step={1}
                value={[
                  filters.difficultyMin ?? 0,
                  filters.difficultyMax ?? 6,
                ]}
                onValueChange={([min, max]) => {
                  actions.updateFilter("difficultyMin", min === 0 ? undefined : min);
                  actions.updateFilter("difficultyMax", max === 6 ? undefined : max);
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filters.difficultyMin ?? 0}</span>
                <span>{filters.difficultyMax ?? 6}</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Control</span>
              <Slider
                min={0}
                max={6}
                step={1}
                value={[filters.controlMin ?? 0, filters.controlMax ?? 6]}
                onValueChange={([min, max]) => {
                  actions.updateFilter("controlMin", min === 0 ? undefined : min);
                  actions.updateFilter("controlMax", max === 6 ? undefined : max);
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filters.controlMin ?? 0}</span>
                <span>{filters.controlMax ?? 6}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GalleryHeader() {
  const { state, actions, meta } = useGalleryFilters();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const typeOptions = useMemo(
    () =>
      meta.uniqueValues?.types.map((t) => ({ value: t, label: t })) ?? [],
    [meta.uniqueValues]
  );

  const setOptions = useMemo(() => {
    const uniqueValues = meta.uniqueValues;
    if (!uniqueValues) return [];
    return uniqueValues.setNames.map((name, idx) => ({
      value: uniqueValues.setCodes[idx],
      label: name,
    }));
  }, [meta.uniqueValues]);

  const keywordOptions = useMemo(
    () =>
      meta.uniqueValues?.keywords.map((k) => ({ value: k, label: k })) ?? [],
    [meta.uniqueValues]
  );

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative w-72 shrink-0 flex items-center">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={
              state.searchMode === "name" 
                ? "Search by name…" 
                : state.searchMode === "text"
                ? "Search card text…"
                : "Search all fields…"
            }
            value={state.search}
            onChange={(e) => actions.setSearch(e.target.value)}
            className="h-8 pl-8 pr-[5.5rem] text-sm"
            name="gallery-search"
            spellCheck={false}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <div className="flex items-center bg-muted rounded-md p-0.5">
              <button
                type="button"
                onClick={() => actions.setSearchMode("name")}
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                  state.searchMode === "name"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Search by name"
              >
                Name
              </button>
              <button
                type="button"
                onClick={() => actions.setSearchMode("text")}
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                  state.searchMode === "text"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Search by text"
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => actions.setSearchMode("all")}
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                  state.searchMode === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Search all fields"
              >
                All
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <span className="font-medium text-foreground">
            {meta.filteredCount.toLocaleString()}
          </span>
          {meta.filteredCount !== meta.totalCards && (
            <>
              <span>of</span>
              <span>{meta.totalCards.toLocaleString()}</span>
            </>
          )}
          <span>cards</span>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <div className="flex items-center gap-1.5 flex-wrap">
          {meta.formats.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1 text-xs",
                    state.filters.format && "border-primary"
                  )}
                >
                  <span>{state.filters.format ? meta.formats.find(f => f.key === state.filters.format)?.name ?? state.filters.format : "Format"}</span>
                  {state.filters.format ? (
                    <X
                      className="h-3 w-3 shrink-0"
                      role="button"
                      tabIndex={0}
                      aria-label="Clear filter"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.updateFilter("format", undefined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          actions.updateFilter("format", undefined);
                        }
                      }}
                    />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  {meta.formats.map((format) => (
                    <button
                      key={format.key}
                      type="button"
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded text-left",
                        state.filters.format === format.key
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => {
                        actions.updateFilter("format", format.key);
                      }}
                    >
                      <span className="text-sm">{format.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          <MultiSelectFilter
            label="Type"
            options={typeOptions}
            selected={state.filters.type ?? []}
            onChange={(selected) => actions.updateFilter("type", selected)}
          />

          <MultiSelectFilter
            label="Set"
            options={setOptions}
            selected={state.filters.set ?? []}
            onChange={(selected) => actions.updateFilter("set", selected)}
          />

          <SymbolSelectFilter
            symbols={meta.uniqueValues?.symbols ?? []}
            selected={state.filters.symbols ?? []}
            onChange={(selected) => actions.updateFilter("symbols", selected)}
          />

          <MultiSelectFilter
            label="Keywords"
            options={keywordOptions}
            selected={state.filters.keywords ?? []}
            onChange={(selected) => actions.updateFilter("keywords", selected)}
            maxDisplay={1}
          />

          <RangeFilter
            label="Control"
            min={0}
            max={6}
            value={[state.filters.controlMin, state.filters.controlMax]}
            onChange={([min, max]) => {
              actions.updateFilter("controlMin", min);
              actions.updateFilter("controlMax", max);
            }}
          />

          <RangeFilter
            label="Difficulty"
            min={0}
            max={6}
            value={[state.filters.difficultyMin, state.filters.difficultyMax]}
            onChange={([min, max]) => {
              actions.updateFilter("difficultyMin", min);
              actions.updateFilter("difficultyMax", max);
            }}
          />

          {meta.activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={actions.clearAllFilters}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="ml-auto">
          <Sheet open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Filters</span>
                {meta.activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {meta.activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Cards</SheetTitle>
              </SheetHeader>
              <FilterPanel />
            </SheetContent>
          </Sheet>
        </div>
      </div>
  );
}

export { GalleryHeader as GalleryTopBarFilters };
