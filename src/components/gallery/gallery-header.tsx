"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, Filter, Sparkles, LayoutGrid, List, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogClose,
  DialogContent, DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SymbolBadge } from "@/components/universus/symbol-icon";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import type { StatOperator, StatFilterValue, CardFilters } from "@/providers/UIStateProvider";

type StatFilterKey = "difficulty" | "control" | "speed" | "damage" | "blockModifier" | "handSize" | "health" | "stamina";

const OPERATOR_OPTIONS: { value: StatOperator; label: string }[] = [
  { value: "eq", label: "=" },
  { value: "neq", label: "≠" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
];

interface StatInputProps {
  label: string;
  filterKey: StatFilterKey;
  value: StatFilterValue | undefined;
  onChange: (key: StatFilterKey, value: StatFilterValue | undefined) => void;
}

function StatInput({ label, filterKey, value, onChange }: StatInputProps) {
  const hasValue = value?.value !== undefined;

  const handleOperatorChange = (op: string) => {
    if (value?.value !== undefined) {
      onChange(filterKey, { operator: op as StatOperator, value: value.value });
    } else {
      onChange(filterKey, { operator: op as StatOperator, value: 0 });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
    if (numValue === undefined || isNaN(numValue)) {
      onChange(filterKey, undefined);
    } else {
      onChange(filterKey, { operator: value?.operator ?? "eq", value: numValue });
    }
  };

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      <span className="text-[11px] font-mono text-muted-foreground w-14 md:w-16 shrink-0">{label}</span>
      <div className={cn(
        "relative flex items-center h-7 flex-1 rounded-md border bg-background/50 overflow-hidden transition-all",
        hasValue 
          ? "border-primary/40 shadow-[0_0_8px_-3px_var(--primary)]" 
          : "border-border/50"
      )}>
        <Select
          value={value?.operator ?? "eq"}
          onValueChange={handleOperatorChange}
        >
          <SelectTrigger 
            size="sm"
            className="h-full w-10 px-0 text-[11px] font-mono border-0 bg-muted/60 rounded-none shadow-none focus-visible:ring-0 focus-visible:shadow-none justify-center"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATOR_OPTIONS.map((op) => (
              <SelectItem key={op.value} value={op.value} className="text-xs font-mono">
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="number"
          className="h-full flex-1 px-2 text-[11px] font-mono bg-transparent border-0 outline-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/50"
          value={value?.value ?? ""}
          onChange={handleValueChange}
          placeholder=""
        />
      </div>
    </div>
  );
}

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FilterDialog({ open, onOpenChange }: FilterDialogProps) {
  const context = useGalleryFiltersOptional();
  const [setSearch, setSetSearch] = useState("");
  
  if (!context) return null;
  const { state, actions, meta } = context;
  const filters = state.filters;
  const uniqueValues = meta.uniqueValues;
  const hasActiveFilters = meta.activeFilterCount > 0;

  const filteredSets = useMemo(() => {
    if (!uniqueValues?.setNames) return [];
    const sets = uniqueValues.setNames.map((name, idx) => ({
      name,
      code: uniqueValues.setCodes[idx],
      number: uniqueValues.setNumbers?.[idx] ?? 0,
    }));
    if (!setSearch.trim()) return sets;
    const search = setSearch.toLowerCase();
    return sets.filter((s) => s.name.toLowerCase().includes(search) || s.code.toLowerCase().includes(search));
  }, [uniqueValues?.setNames, uniqueValues?.setCodes, uniqueValues?.setNumbers, setSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="p-0 overflow-hidden max-h-[85vh] md:pb-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Filter Cards</DialogTitle>
        
        <div className="relative flex flex-col h-full pb-20 md:pb-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="relative z-10 p-6 border-b border-border/30 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/40 shadow-[0_0_12px_-3px_var(--primary)]">
                  <Filter className="h-5 w-5 text-primary drop-shadow-[0_0_4px_var(--primary)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-display font-bold uppercase tracking-wide">Filter Cards</h2>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    {meta.filteredCount.toLocaleString()} of {meta.totalCards.toLocaleString()} cards
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={actions.clearAllFilters}
                    className="hidden md:flex gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="font-mono uppercase tracking-wider text-xs">Clear All</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto p-6 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0 w-12">Format</span>
                    <div className="flex flex-wrap gap-1">
                      {meta.formats.map((format) => (
                        <Badge
                          key={format.key}
                          variant={filters.format === format.key ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all text-[10px] px-2 py-0.5",
                            filters.format === format.key && "shadow-[0_0_10px_-3px_var(--primary)]"
                          )}
                          onClick={() => {
                            if (filters.format === format.key) {
                              actions.updateFilter("format", undefined);
                            } else {
                              actions.updateFilter("format", format.key);
                            }
                          }}
                        >
                          {format.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0 w-12 pt-0.5">Type</span>
                    <div className="flex flex-wrap gap-1">
                      {uniqueValues?.types.map((type) => (
                        <Badge
                          key={type}
                          variant={filters.type?.includes(type) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all text-[10px] px-2 py-0.5",
                            filters.type?.includes(type) && "shadow-[0_0_10px_-3px_var(--primary)]"
                          )}
                          onClick={() => {
                            const current = filters.type ?? [];
                            if (current.includes(type)) {
                              actions.updateFilter("type", current.filter((t) => t !== type));
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
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0 w-12 pt-0.5">Rarity</span>
                    <div className="flex flex-wrap gap-1">
                      {uniqueValues?.rarities.map((rarity) => (
                        <Badge
                          key={rarity}
                          variant={filters.rarity?.includes(rarity) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all text-[10px] px-2 py-0.5",
                            filters.rarity?.includes(rarity) && "shadow-[0_0_10px_-3px_var(--primary)]"
                          )}
                          onClick={() => {
                            const current = filters.rarity ?? [];
                            if (current.includes(rarity)) {
                              actions.updateFilter("rarity", current.filter((r) => r !== rarity));
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
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Symbols</span>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={filters.symbols?.includes("infinity") ?? false}
                          onCheckedChange={(checked) => {
                            const current = filters.symbols ?? [];
                            if (checked) {
                              actions.updateFilter("symbols", [...current, "infinity"]);
                            } else {
                              actions.updateFilter("symbols", current.filter((s) => s !== "infinity"));
                            }
                          }}
                        />
                        <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer">
                          Infinity
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={filters.symbolMatchAll ?? false}
                          onCheckedChange={(checked) =>
                            actions.updateFilter("symbolMatchAll", checked ? true : undefined)
                          }
                        />
                        <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer">
                          Match All
                        </Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Standard</span>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-1.5">
                          {uniqueValues?.symbols
                            .filter((s) => !s.startsWith("attuned:") && s !== "infinity")
                            .map((symbol) => (
                              <SymbolBadge
                                key={symbol}
                                symbol={symbol}
                                selected={filters.symbols?.includes(symbol)}
                                onClick={() => {
                                  const current = filters.symbols ?? [];
                                  if (current.includes(symbol)) {
                                    actions.updateFilter("symbols", current.filter((s) => s !== symbol));
                                  } else {
                                    actions.updateFilter("symbols", [...current, symbol]);
                                  }
                                }}
                                size="sm"
                              />
                            ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Attuned</span>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-1.5">
                          {uniqueValues?.symbols
                            .filter((s) => s.startsWith("attuned:"))
                            .map((symbol) => (
                              <SymbolBadge
                                key={symbol}
                                symbol={symbol}
                                selected={filters.symbols?.includes(symbol)}
                                onClick={() => {
                                  const current = filters.symbols ?? [];
                                  if (current.includes(symbol)) {
                                    actions.updateFilter("symbols", current.filter((s) => s !== symbol));
                                  } else {
                                    actions.updateFilter("symbols", [...current, symbol]);
                                  }
                                }}
                                size="sm"
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Set</span>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search sets..."
                        value={setSearch}
                        onChange={(e) => setSetSearch(e.target.value)}
                        className="h-7 pl-8 text-xs bg-background/50"
                      />
                      {setSearch && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setSetSearch("")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-[140px] overflow-y-auto grid grid-cols-2 gap-1">
                      {filteredSets.map((set) => {
                        const isSelected = filters.set?.includes(set.code);
                        return (
                          <div
                            key={set.name}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all border",
                              isSelected 
                                ? "bg-primary/15 border-primary/30 shadow-[0_0_10px_-5px_var(--primary)]" 
                                : "border-transparent hover:bg-muted/50"
                            )}
                            onClick={() => {
                              const current = filters.set ?? [];
                              if (isSelected) {
                                actions.updateFilter("set", current.filter((s) => s !== set.code));
                              } else {
                                actions.updateFilter("set", [...current, set.code]);
                              }
                            }}
                          >
                            <Checkbox checked={isSelected} className="pointer-events-none h-3 w-3" />
                            <span className="text-[11px] truncate">{set.name}</span>
                          </div>
                        );
                      })}
                      {filteredSets.length === 0 && (
                        <div className="col-span-full text-center text-xs text-muted-foreground py-2">
                          No sets match
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Keywords</span>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={filters.keywordMatchAll ?? false}
                        onCheckedChange={(checked) =>
                          actions.updateFilter("keywordMatchAll", checked ? true : undefined)
                        }
                      />
                      <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer">
                        Match All
                      </Label>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm">
                    <div className="grid grid-cols-5 gap-1">
                      {uniqueValues?.keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant={filters.keywords?.includes(keyword) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer text-[10px] px-1 py-0.5 transition-all w-full justify-center truncate",
                            filters.keywords?.includes(keyword) && "shadow-[0_0_8px_-3px_var(--primary)]"
                          )}
                          onClick={() => {
                            const current = filters.keywords ?? [];
                            if (current.includes(keyword)) {
                              actions.updateFilter("keywords", current.filter((k) => k !== keyword));
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
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Stats</span>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Card</span>
                        <div className="space-y-1.5">
                          <StatInput
                            label="Difficulty"
                            filterKey="difficulty"
                            value={filters.difficulty}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                          <StatInput
                            label="Control"
                            filterKey="control"
                            value={filters.control}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Block</span>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 md:gap-3">
                            <span className="text-[11px] font-mono text-muted-foreground w-14 md:w-16 shrink-0">Zone</span>
                            <div className="flex h-7 flex-1 items-center rounded-md border border-border/50 bg-background/50 overflow-hidden">
                              {["High", "Mid", "Low"].map((zone, idx) => (
                                <button
                                  key={zone}
                                  type="button"
                                  className={cn(
                                    "h-full flex-1 text-[10px] font-mono transition-all",
                                    idx !== 0 && "border-l border-border/50",
                                    filters.blockZone?.includes(zone) 
                                      ? "bg-primary/20 text-primary shadow-[inset_0_0_8px_-3px_var(--primary)]" 
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                  )}
                                  onClick={() => {
                                    const current = filters.blockZone ?? [];
                                    if (current.includes(zone)) {
                                      actions.updateFilter("blockZone", current.filter((z) => z !== zone));
                                    } else {
                                      actions.updateFilter("blockZone", [...current, zone]);
                                    }
                                  }}
                                >
                                  {zone}
                                </button>
                              ))}
                            </div>
                          </div>
                          <StatInput
                            label="Modifier"
                            filterKey="blockModifier"
                            value={filters.blockModifier}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Attack</span>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 md:gap-3">
                            <span className="text-[11px] font-mono text-muted-foreground w-14 md:w-16 shrink-0">Zone</span>
                            <div className="flex h-7 flex-1 items-center rounded-md border border-border/50 bg-background/50 overflow-hidden">
                              {["High", "Mid", "Low"].map((zone, idx) => (
                                <button
                                  key={zone}
                                  type="button"
                                  className={cn(
                                    "h-full flex-1 text-[10px] font-mono transition-all",
                                    idx !== 0 && "border-l border-border/50",
                                    filters.attackZone?.includes(zone) 
                                      ? "bg-primary/20 text-primary shadow-[inset_0_0_8px_-3px_var(--primary)]" 
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                  )}
                                  onClick={() => {
                                    const current = filters.attackZone ?? [];
                                    if (current.includes(zone)) {
                                      actions.updateFilter("attackZone", current.filter((z) => z !== zone));
                                    } else {
                                      actions.updateFilter("attackZone", [...current, zone]);
                                    }
                                  }}
                                >
                                  {zone}
                                </button>
                              ))}
                            </div>
                          </div>
                          <StatInput
                            label="Speed"
                            filterKey="speed"
                            value={filters.speed}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                          <StatInput
                            label="Damage"
                            filterKey="damage"
                            value={filters.damage}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">General</span>
                        <div className="space-y-1.5">
                          <StatInput
                            label="Health"
                            filterKey="health"
                            value={filters.health}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                          <StatInput
                            label="Hand Size"
                            filterKey="handSize"
                            value={filters.handSize}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                          <StatInput
                            label="Stamina"
                            filterKey="stamina"
                            value={filters.stamina}
                            onChange={(key, val) => actions.updateFilter(key, val)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="md:hidden">
          <DialogClose asChild>
            <div className="flex items-center justify-end w-full">
              <Button
                  className="gap-2 ml-auto"
              >
                <span className="font-mono uppercase tracking-wider text-xs">Close</span>
              </Button>
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GalleryHeader() {
  const context = useGalleryFiltersOptional();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  if (!context) return null;
  const { state, actions, meta } = context;

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

  const viewModeIcons = {
    card: LayoutGrid,
    list: List,
    details: FileText,
  };
  const CurrentViewIcon = viewModeIcons[state.viewMode];

  const viewSelector = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Change view mode"
        >
          <CurrentViewIcon className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">View Mode</span>
          <div className="flex gap-1">
            {(["card", "list", "details"] as const).map((mode) => {
              const Icon = viewModeIcons[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => actions.setViewMode(mode)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 p-2 rounded-md transition-all",
                    state.viewMode === mode
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted border border-transparent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-mono uppercase">{mode}</span>
                </button>
              );
            })}
          </div>
          {state.viewMode === "card" && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">Cards per row</span>
                <span className="text-xs font-mono text-primary">{state.cardsPerRow}</span>
              </div>
              <Slider
                min={3}
                max={10}
                step={1}
                value={[state.cardsPerRow]}
                onValueChange={([value]) => actions.setCardsPerRow(value)}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  const filterPanelButton = (
    <>
      <button
        type="button"
        className="relative flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open filter panel"
        onClick={() => setIsFilterPanelOpen(true)}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {meta.activeFilterCount > 0 && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-0.5 text-[9px] flex items-center justify-center">
            {meta.activeFilterCount}
          </Badge>
        )}
      </button>
      <FilterDialog open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen} />
    </>
  );

  return (
    <div className="flex items-center justify-center w-full">
      <div className="relative w-full max-w-xl flex items-center">
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          <Search className="h-4 w-4 text-primary/70 ml-1" />
          <Select
            value={state.searchMode}
            onValueChange={(value) => actions.setSearchMode(value as "name" | "text" | "all")}
          >
            <SelectTrigger 
              size="sm" 
              className="h-6 px-2 mx-1 rounded-none py-0 text-[10px] border-x-1 border-y-0 border-primary/40 shadow-none focus-visible:ring-0 focus-visible:shadow-none min-w-[3.5rem]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          className="h-9 pl-[6.5rem] pr-20 text-sm border-primary/40 bg-background/50 shadow-[0_0_10px_-3px_var(--primary)] focus-visible:border-primary focus-visible:shadow-[0_0_15px_-3px_var(--primary)]"
          name="gallery-search"
          spellCheck={false}
        />
        <div className="absolute right-[1px] top-[1px] bottom-[1px] flex items-stretch">
          <div className="flex items-center justify-center px-1.5">
            {viewSelector}
          </div>
          <div className="flex items-center justify-center px-1.5">
            {filterPanelButton}
          </div>
          {meta.activeFilterCount > 0 && (
              <button
                type="button"
                onClick={actions.clearAllFilters}
                className="flex items-center justify-center px-2.5 bg-primary/10 hover:bg-primary/20 text-primary transition-colors rounded-r-md"
                aria-label="Clear all filters"
              >
                <X className="h-3.5 w-3.5" />
              </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { GalleryHeader as GalleryTopBarFilters };
