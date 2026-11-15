import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchField } from "@/components/ui/search-field";
import { controlFieldClassName, controlHeightClassName } from "@/components/ui/control";
import { cn } from "@/lib/utils";
import { useGalleryFilterNestedPopoverPortalContainer } from "./nested-popover-portal-context";

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
  const nestedPopoverPortalContainer = useGalleryFilterNestedPopoverPortalContainer();
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
              "flex w-full items-center justify-between px-3 text-left",
              controlFieldClassName,
              controlHeightClassName.md,
              selectedValues.length > 0 && "border-(--selected-border) bg-(--selected-bg) text-(--selected-fg)"
            )}
          >
            <span className="chrome-label-case truncate text-xs">
              {selectedValues.length > 0 ? `${selectedValues.length} selected` : triggerLabel}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={nestedPopoverPortalContainer}
          className="w-[min(22rem,calc(100vw-2rem))] p-0"
          align="start"
        >
          <div className="border-b border-border/50 p-2.5">
            <SearchField value={search} onValueChange={setSearch} placeholder={searchPlaceholder} />
          </div>

          <div className="max-h-64 touch-pan-y overflow-y-auto overscroll-contain p-2 [-webkit-overflow-scrolling:touch]">
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
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected ? "bg-primary/15 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/55 bg-background dark:border-muted-foreground/65"
                        )}
                      >
                        {selected ? <Check className="h-3 w-3" /> : null}
                      </span>

                      <span className="chrome-label-case truncate text-[11px]">
                        {option.label}
                      </span>

                      {option.meta ? (
                        <span className="chrome-label-case ml-auto truncate text-[10px] text-muted-foreground">
                          {option.meta}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="chrome-label-case px-2 py-5 text-center text-[11px] text-muted-foreground">
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
              className="chrome-label-case rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
            >
              {label}
            </span>
          ))}
          {selectedLabels.length > 3 ? (
            <span className="chrome-label-case rounded border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              +{selectedLabels.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
