"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useGameModule } from "@/games/game-context";
import { ColorFacetChips } from "../mobile-filter-sheet/color-facet-chips";
import { useGalleryFilterDialogContext } from "./context";
import { SearchableMultiSelect } from "./searchable-multi-select";

const sectionShellClassName = "rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm";

/** Color facet picker; renders only for games whose filter definition declares `facets.colors`. */
export function ColorsSection() {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const options = useGameModule().filters.facets.colors;

  if (!options || options.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="chrome-label-case text-xs text-muted-foreground">Colors</span>
      <div className={sectionShellClassName}>
        <ColorFacetChips
          options={options}
          selected={filters.colors ?? []}
          onToggle={(value) => toggleStringFilter("colors", value)}
          chipClassName="h-7 gap-1 px-2.5 text-xs"
          rowClassName="gap-1.5"
        />
      </div>
    </div>
  );
}

/** Tag facet picker (values from the catalog); renders only when `facets.tags`. */
export function TagsSection() {
  const { filters, meta, toggleStringFilter } = useGalleryFilterDialogContext();
  const showTags = useGameModule().filters.facets.tags;
  const tags = meta.uniqueValues?.tags;
  const options = useMemo(() => (tags ?? []).map((tag) => ({ value: tag, label: tag })), [tags]);
  const selected = filters.tags ?? [];

  if (!showTags) return null;

  return (
    <div className="space-y-2">
      <span className="chrome-label-case text-xs text-muted-foreground">Tags</span>
      <div className={`space-y-2 ${sectionShellClassName}`}>
        <SearchableMultiSelect
          options={options}
          selectedValues={selected}
          onToggle={(tag) => toggleStringFilter("tags", tag)}
          triggerLabel="Select tags"
          searchPlaceholder="Search tags..."
          emptyMessage="No tags match"
        />
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selected.map((tag) => (
              <Badge key={`tag-selected-${tag}`} variant="outline" className="px-1.5 py-0.5 text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
