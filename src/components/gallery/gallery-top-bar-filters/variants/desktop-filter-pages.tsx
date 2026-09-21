"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { StatInput } from "@/components/gallery/filter-dialog/stat-input";
import { ZONE_OPTIONS } from "@/components/gallery/filter-dialog/constants";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import {
  ActiveFilterChip,
  FilterChip,
  FilterGroup,
  FilterRow,
} from "@/components/gallery/mobile-filter-sheet/primitives";
import { cn } from "@/lib/utils";

const compactChipClassName = "h-7 w-[100px] justify-center gap-1 px-2 text-xs";

function DesktopFilterSearch({
  value,
  onChange,
  placeholder,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  name: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        name={name}
        autoComplete="off"
        spellCheck={false}
        className="h-8 w-full rounded-lg border border-border/50 bg-background/60 pl-8 pr-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function GalleryDesktopFilterSetsPage() {
  const { filters, setOptions, toggleStringFilter } = useGalleryFilterDialogContext();
  const [query, setQuery] = useState("");
  const selected = filters.set ?? [];

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return setOptions.filter((set) => {
      if (!q) return true;
      return set.name.toLowerCase().includes(q) || set.code.toLowerCase().includes(q);
    });
  }, [query, setOptions]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 px-4 pb-2 pt-3">
        <DesktopFilterSearch
          value={query}
          onChange={setQuery}
          placeholder="Search sets…"
          name="gallery-desktop-filter-sets"
        />
        {selected.length > 0 ? (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selected.map((code) => {
              const set = setOptions.find((option) => option.code === code);
              return (
                <ActiveFilterChip
                  key={code}
                  label={set?.name ?? code}
                  onRemove={() => toggleStringFilter("set", code)}
                />
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {options.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            {options.map((set) => {
              const isSelected = selected.includes(set.code);
              return (
                <button
                  key={set.code}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleStringFilter("set", set.code)}
                  className={cn(
                    "flex min-w-0 items-center rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/40 bg-background/40 text-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="truncate">{set.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No sets match</p>
        )}
      </div>
    </div>
  );
}

export function GalleryDesktopFilterKeywordsPage() {
  const { filters, meta, toggleStringFilter } = useGalleryFilterDialogContext();
  const [query, setQuery] = useState("");
  const selected = filters.keywords ?? [];
  const keywords = meta.uniqueValues?.keywords ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return keywords;
    return keywords.filter((keyword) => keyword.toLowerCase().includes(q));
  }, [keywords, query]);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mb-3">
        <DesktopFilterSearch
          value={query}
          onChange={setQuery}
          placeholder="Search keywords…"
          name="gallery-desktop-filter-keywords"
        />
      </div>
      {visible.length > 0 ? (
        <div className="grid grid-cols-[repeat(6,100px)] gap-1.5">
          {visible.map((keyword) => (
            <FilterChip
              key={keyword}
              label={keyword}
              selected={selected.includes(keyword)}
              className={compactChipClassName}
              onClick={() => toggleStringFilter("keywords", keyword)}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No keywords match</p>
      )}
    </div>
  );
}

function DesktopZoneRule({ filterKey, label }: { filterKey: "blockZone" | "attackZone"; label: string }) {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const selected = filters[filterKey] ?? [];

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <div className="flex h-7 min-w-0 flex-1 overflow-hidden rounded-md border border-border/50 bg-background/50">
        {ZONE_OPTIONS.map((zone, index) => {
          const isSelected = selected.includes(zone);
          return (
            <button
              key={zone}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleStringFilter(filterKey, zone)}
              className={cn(
                "min-w-0 flex-1 text-[11px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                index !== 0 && "border-l border-border/40",
                isSelected ? "bg-primary/20 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {zone}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GalleryDesktopFilterStatsPage() {
  return (
    <div className="grid grid-cols-2 items-start gap-4 px-4 pb-4 pt-3">
      <FilterGroup label="General">
        <FilterRow className="space-y-1.5 py-2.5">
          <StatInput label="Difficulty" filterKey="difficulty" labelPosition="end" />
          <StatInput label="Control" filterKey="control" labelPosition="end" />
          <StatInput label="Health" filterKey="health" labelPosition="end" />
          <StatInput label="Hand Size" filterKey="handSize" labelPosition="end" />
          <StatInput label="Stamina" filterKey="stamina" labelPosition="end" />
        </FilterRow>
      </FilterGroup>
      <div className="space-y-4">
        <FilterGroup label="Block">
          <FilterRow className="space-y-1.5 py-2.5">
            <DesktopZoneRule filterKey="blockZone" label="Zone" />
            <StatInput label="Modifier" filterKey="blockModifier" labelPosition="end" />
          </FilterRow>
        </FilterGroup>
        <FilterGroup label="Attack">
          <FilterRow className="space-y-1.5 py-2.5">
            <DesktopZoneRule filterKey="attackZone" label="Zone" />
            <StatInput label="Speed" filterKey="speed" labelPosition="end" />
            <StatInput label="Damage" filterKey="damage" labelPosition="end" />
          </FilterRow>
        </FilterGroup>
      </div>
    </div>
  );
}
