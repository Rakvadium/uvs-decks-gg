import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "./context";
import { SearchableMultiSelect } from "./searchable-multi-select";

export function SetSection() {
  const isMobile = useIsMobile();
  const {
    clearSetSearch,
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
    return (
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Set</span>
        <div className="space-y-2 rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sets..."
              value={setSearch}
              onChange={(event) => setSetSearch(event.target.value)}
              className="h-7 bg-background/50 pl-8 text-xs"
            />
            {setSearch ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={clearSetSearch}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>

          <div className="grid max-h-[140px] grid-cols-2 gap-1 overflow-y-auto">
            {filteredSets.map((setOption) => {
              const isSelected = selectedSets.includes(setOption.code);

              return (
                <div
                  key={setOption.name}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 transition-all",
                    isSelected
                      ? "border-primary/30 bg-primary/15 shadow-[0_0_10px_-5px_var(--primary)]"
                      : "border-transparent hover:bg-muted/50"
                  )}
                  onClick={() => toggleStringFilter("set", setOption.code)}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none h-3 w-3" />
                  <span className="truncate text-[11px]">{setOption.name}</span>
                </div>
              );
            })}

            {filteredSets.length === 0 ? (
              <div className="col-span-full py-2 text-center text-xs text-muted-foreground">No sets match</div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Set</span>
      <div className="rounded-lg border border-border/50 bg-card/30 p-2.5 backdrop-blur-sm">
        <SearchableMultiSelect
          options={options}
          selectedValues={selectedSets}
          onToggle={(setCode) => toggleStringFilter("set", setCode)}
          triggerLabel="Select sets"
          searchPlaceholder="Search sets..."
          emptyMessage="No sets match"
        />
      </div>
    </div>
  );
}
