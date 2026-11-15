import { useMemo } from "react";
import { Panel } from "@/components/ui/panel";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchField } from "@/components/ui/search-field";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "./context";
import { SearchableMultiSelect } from "./searchable-multi-select";

export function SetSection({ plain = false }: { plain?: boolean } = {}) {
  const isMobile = useIsMobile();
  const {
    filteredSets,
    filters,
    setOptions,
    setSearch,
    setSetSearch,
    toggleStringFilter,
  } = useGalleryFilterDialogContext();

  const selectedSets = filters.set ?? [];
  const options = useMemo(
    () =>
      setOptions.map((setOption) => ({
        value: setOption.code,
        label: setOption.name,
        meta: setOption.code,
      })),
    [setOptions]
  );

  if (!isMobile) {
    const list = (
      <>
        <SearchField placeholder="Search sets..." value={setSearch} onValueChange={setSetSearch} name="filter-set-search" />

        <div className="grid max-h-[140px] grid-cols-2 gap-1 overflow-y-auto">
          {filteredSets.map((setOption) => {
            const isSelected = selectedSets.includes(setOption.code);

            return (
              <div
                key={setOption.code}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 transition-colors",
                  isSelected
                    ? "border-primary/30 bg-primary/15 shadow-[var(--chrome-filter-tile-shadow-selected)]"
                    : "border-transparent hover:bg-muted/50"
                )}
                onClick={() => toggleStringFilter("set", setOption.code)}
              >
                <Checkbox
                  checked={isSelected}
                  className="pointer-events-none size-3.5 [&_svg]:size-2.5"
                />
                <span className="truncate text-[11px]">{setOption.name}</span>
              </div>
            );
          })}

          {filteredSets.length === 0 ? (
            <div className="col-span-full py-2 text-center text-xs text-muted-foreground">No sets match</div>
          ) : null}
        </div>
      </>
    );

    if (plain) {
      return <div className="space-y-2">{list}</div>;
    }

    return (
      <div className="space-y-2">
        <span className="chrome-label-case text-xs text-muted-foreground">Set</span>
        <Panel className="space-y-2 p-3">
          {list}
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="chrome-label-case text-xs text-muted-foreground">Set</span>
      <SearchableMultiSelect
        options={options}
        selectedValues={selectedSets}
        onToggle={(setCode) => toggleStringFilter("set", setCode)}
        triggerLabel="Select sets"
        searchPlaceholder="Search sets..."
        emptyMessage="No sets match"
      />
    </div>
  );
}
