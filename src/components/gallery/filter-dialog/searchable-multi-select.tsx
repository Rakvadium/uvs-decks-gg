import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableMultiSelectOption {
  value: string;
  label: string;
  meta?: string;
}

interface SearchableMultiSelectProps {
  options: SearchableMultiSelectOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  triggerLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

export function SearchableMultiSelect({
  options,
  selectedValues,
  onToggle,
  triggerLabel,
  searchPlaceholder,
  emptyMessage,
}: SearchableMultiSelectProps) {
  const [search, setSearch] = useState("");
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;

    return options.filter((option) => {
      const haystacks = [option.label, option.value, option.meta ?? ""];
      return haystacks.some((value) => value.toLowerCase().includes(query));
    });
  }, [options, search]);

  const selectedLabels = useMemo(() => {
    if (selectedValues.length === 0) return [];
    const labelMap = new Map(options.map((option) => [option.value, option.label]));
    return selectedValues.map((value) => labelMap.get(value) ?? value);
  }, [options, selectedValues]);

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border px-3 text-left transition-colors",
              selectedValues.length > 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 bg-background/60 text-foreground hover:border-primary/30 hover:bg-muted/40"
            )}
          >
            <span className="truncate text-xs font-mono uppercase tracking-wider">
              {selectedValues.length > 0 ? `${selectedValues.length} selected` : triggerLabel}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="start">
          <div className="border-b border-border/50 p-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-8 pr-7 text-xs"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.length > 0 ? (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const selected = selectedSet.has(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onToggle(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                        selected ? "bg-primary/15 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selected ? "border-primary/60 bg-primary/20" : "border-border/70 bg-background/60"
                        )}
                      >
                        {selected ? <Check className="h-3 w-3" /> : null}
                      </span>

                      <span className="truncate text-[11px] font-mono uppercase tracking-wide">
                        {option.label}
                      </span>

                      {option.meta ? (
                        <span className="ml-auto truncate text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {option.meta}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-2 py-5 text-center text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.slice(0, 3).map((label) => (
            <span
              key={`${triggerLabel}-${label}`}
              className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary"
            >
              {label}
            </span>
          ))}
          {selectedLabels.length > 3 ? (
            <span className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              +{selectedLabels.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
