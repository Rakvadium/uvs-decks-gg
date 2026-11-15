"use client";

import { useMemo, useState } from "react";
import {
  getFilterGroupLayout,
  type GameFilterGroupLayout,
  type GameZoneFilterDescriptor,
} from "@shared/games/filters";
import { StatInput } from "@/components/gallery/filter-dialog/stat-input";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import type { StatFilterKey, StringArrayFilterKey } from "@/components/gallery/filter-dialog/types";
import { useGameModule } from "@/games/game-context";
import {
  ActiveFilterChip,
  FilterChip,
  FilterGroup,
  FilterRow,
} from "@/components/gallery/mobile-filter-sheet/primitives";
import { ColorFacetChips } from "@/components/gallery/mobile-filter-sheet/color-facet-chips";
import { OptionTile } from "@/components/ui/option-tile";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";

const compactChipClassName = "w-[100px] justify-center";

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
        <SearchField
          value={query}
          onValueChange={setQuery}
          placeholder="Search sets…"
          name="gallery-desktop-filter-sets"
        />
        {selected.length > 0 ? (
          <div className="-mx-4 flex gap-1.5 scroll-row px-4">
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
                <OptionTile
                  key={set.code}
                  selected={isSelected}
                  onClick={() => toggleStringFilter("set", set.code)}
                  className="flex min-w-0 items-center px-2.5 py-1.5 text-left text-xs font-medium"
                >
                  <span className="truncate">{set.name}</span>
                </OptionTile>
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
        <SearchField
          value={query}
          onValueChange={setQuery}
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
              size="xs"
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

export function GalleryDesktopFilterColorsPage() {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const options = useGameModule().filters.facets.colors ?? [];

  return (
    <div className="px-4 pb-4 pt-3">
      <FilterGroup>
        <FilterRow className="py-2">
          <ColorFacetChips
            options={options}
            selected={filters.colors ?? []}
            onToggle={(value) => toggleStringFilter("colors", value)}
            chipSize="xs"
            rowClassName="gap-1.5"
          />
        </FilterRow>
      </FilterGroup>
    </div>
  );
}

export function GalleryDesktopFilterTagsPage() {
  const { filters, meta, toggleStringFilter } = useGalleryFilterDialogContext();
  const [query, setQuery] = useState("");
  const selected = filters.tags ?? [];
  const tags = meta.uniqueValues?.tags;

  const visible = useMemo(() => {
    const all = tags ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((tag) => tag.toLowerCase().includes(q));
  }, [tags, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 px-4 pb-2 pt-3">
        <SearchField
          value={query}
          onValueChange={setQuery}
          placeholder="Search tags…"
          name="gallery-desktop-filter-tags"
        />
        {selected.length > 0 ? (
          <div className="-mx-4 flex gap-1.5 scroll-row px-4">
            {selected.map((tag) => (
              <ActiveFilterChip key={tag} label={tag} onRemove={() => toggleStringFilter("tags", tag)} />
            ))}
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {visible.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-1.5">
            {visible.map((tag) => (
              <FilterChip
                key={tag}
                label={tag}
                selected={selected.includes(tag)}
                size="xs"
                className="w-full justify-center"
                onClick={() => toggleStringFilter("tags", tag)}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {tags && tags.length > 0 ? "No tags match" : "No tags in this catalog yet"}
          </p>
        )}
      </div>
    </div>
  );
}

function DesktopZoneRule({ zone: descriptor }: { zone: GameZoneFilterDescriptor }) {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const filterKey = descriptor.key as StringArrayFilterKey;
  const label = descriptor.label;
  const selected = filters[filterKey] ?? [];

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <SegmentedControl
        size="xs"
        stretch
        aria-label={label}
        className="min-w-0 flex-1"
        values={selected}
        onToggle={(zone) => toggleStringFilter(filterKey, zone)}
        items={descriptor.options.map((zone) => ({ value: zone, label: zone }))}
      />
    </div>
  );
}

function DesktopStatsGroup({ group }: { group: GameFilterGroupLayout }) {
  return (
    <FilterGroup label={group.label}>
      <FilterRow className="space-y-1.5 py-2.5">
        {group.zones.map((zone) => (
          <DesktopZoneRule key={zone.key} zone={zone} />
        ))}
        {group.stats.map((stat) => (
          <StatInput key={stat.key} label={stat.label} filterKey={stat.key as StatFilterKey} labelPosition="end" />
        ))}
      </FilterRow>
    </FilterGroup>
  );
}

export function GalleryDesktopFilterStatsPage() {
  const { filters: filterDefinition } = useGameModule();
  // First group fills the left column; the rest stack in the right column.
  const [first, ...rest] = useMemo(() => getFilterGroupLayout(filterDefinition), [filterDefinition]);

  return (
    <div className="grid grid-cols-2 items-start gap-4 px-4 pb-4 pt-3">
      {first ? <DesktopStatsGroup group={first} /> : null}
      <div className="space-y-4">
        {rest.map((group) => (
          <DesktopStatsGroup key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
