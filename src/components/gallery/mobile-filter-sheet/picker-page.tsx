"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobileSearchField } from "@/components/shell/mobile-tab-bar/search-field";
import { MOBILE_INSET_DIVIDER, MOBILE_INSET_GROUP } from "@/components/shell/mobile-glass";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";
import { ActiveFilterChip, FilterOptionRow } from "./primitives";

interface PickerOption {
  value: string;
  label: string;
  meta?: string;
}

function PickerList({
  options,
  selected,
  onToggle,
  searchPlaceholder,
  emptyMessage,
  name,
  trailing,
}: {
  options: PickerOption[];
  selected: string[];
  onToggle: (value: string) => void;
  searchPlaceholder: string;
  emptyMessage: string;
  name: string;
  trailing?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      [option.label, option.value, option.meta ?? ""].some((text) => text.toLowerCase().includes(q))
    );
  }, [options, query]);

  const labelFor = useMemo(() => new Map(options.map((option) => [option.value, option.label])), [options]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 px-4 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <MobileSearchField
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            label={searchPlaceholder}
            name={name}
          />
          {trailing}
        </div>
        {selected.length > 0 ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selected.map((value) => (
              <ActiveFilterChip key={value} label={labelFor.get(value) ?? value} onRemove={() => onToggle(value)} />
            ))}
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {filtered.length > 0 ? (
          <div role="listbox" aria-multiselectable className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER)}>
            {filtered.map((option) => (
              <FilterOptionRow
                key={option.value}
                label={option.label}
                meta={option.meta}
                selected={selectedSet.has(option.value)}
                onToggle={() => onToggle(option.value)}
              />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

export function GalleryMobileFilterSetsPage() {
  const { filters, setOptions, toggleStringFilter } = useGalleryFilterDialogContext();
  const options = useMemo(
    (): PickerOption[] => setOptions.map((set) => ({ value: set.code, label: set.name, meta: set.code })),
    [setOptions]
  );

  return (
    <PickerList
      options={options}
      selected={filters.set ?? []}
      onToggle={(code) => toggleStringFilter("set", code)}
      searchPlaceholder="Search sets"
      emptyMessage="No sets match"
      name="gallery-filter-sets"
    />
  );
}

export function GalleryMobileFilterKeywordsPage() {
  const { filters, meta, toggleStringFilter, setBooleanFilter } = useGalleryFilterDialogContext();
  const options = useMemo(
    (): PickerOption[] => (meta.uniqueValues?.keywords ?? []).map((keyword) => ({ value: keyword, label: keyword })),
    [meta.uniqueValues?.keywords]
  );

  return (
    <PickerList
      options={options}
      selected={filters.keywords ?? []}
      onToggle={(keyword) => toggleStringFilter("keywords", keyword)}
      searchPlaceholder="Search keywords"
      emptyMessage="No keywords match"
      name="gallery-filter-keywords"
      trailing={
        <Label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Switch
            checked={filters.keywordMatchAll ?? false}
            onCheckedChange={(checked) => setBooleanFilter("keywordMatchAll", checked)}
            aria-label="Match all keywords"
          />
          All
        </Label>
      }
    />
  );
}
