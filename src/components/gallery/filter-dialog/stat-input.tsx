import { type ChangeEvent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { StatOperator } from "@/providers/UIStateProvider";
import { OPERATOR_OPTIONS } from "./constants";
import { useGalleryFilterDialogContext } from "./context";
import type { StatFilterKey } from "./types";

interface StatInputProps {
  label: string;
  filterKey: StatFilterKey;
}

export function StatInput({ label, filterKey }: StatInputProps) {
  const { filters, setStatFilter } = useGalleryFilterDialogContext();
  const value = filters[filterKey];
  const hasValue = value?.value !== undefined;

  const handleOperatorChange = (operator: string) => {
    const resolvedOperator = operator as StatOperator;

    if (value?.value !== undefined) {
      setStatFilter(filterKey, { operator: resolvedOperator, value: value.value });
      return;
    }

    setStatFilter(filterKey, { operator: resolvedOperator, value: 0 });
  };

  const handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsedValue =
      event.target.value === "" ? undefined : parseInt(event.target.value, 10);

    if (parsedValue === undefined || Number.isNaN(parsedValue)) {
      setStatFilter(filterKey, undefined);
      return;
    }

    setStatFilter(filterKey, {
      operator: value?.operator ?? "eq",
      value: parsedValue,
    });
  };

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      <span className="w-14 shrink-0 text-[11px] font-mono text-muted-foreground md:w-16">
        {label}
      </span>
      <div
        className={cn(
          "relative flex h-7 flex-1 items-center overflow-hidden rounded-md border bg-background/50 transition-all",
          hasValue
            ? "border-primary/40 shadow-[var(--chrome-filter-tile-shadow-selected)]"
            : "border-border/50"
        )}
      >
        <Select value={value?.operator ?? "eq"} onValueChange={handleOperatorChange}>
          <SelectTrigger
            size="sm"
            className="h-full w-10 justify-center rounded-none border-0 bg-muted/60 px-0 text-[11px] font-mono shadow-none focus-visible:ring-0 focus-visible:shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATOR_OPTIONS.map((operatorOption) => (
              <SelectItem
                key={operatorOption.value}
                value={operatorOption.value}
                className="text-xs font-mono"
              >
                {operatorOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="number"
          className="h-full flex-1 border-0 bg-transparent px-2 text-[11px] font-mono outline-none placeholder:text-muted-foreground/50 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={value?.value ?? ""}
          onChange={handleValueChange}
          placeholder=""
        />
      </div>
    </div>
  );
}
