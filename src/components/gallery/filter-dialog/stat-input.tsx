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
  labelPosition?: "start" | "end";
}

export function StatInput({ label, filterKey, labelPosition = "start" }: StatInputProps) {
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
    <div
      className={cn(
        "flex items-center gap-1.5 md:gap-3",
        labelPosition === "end" && "min-w-0 w-full"
      )}
    >
      {labelPosition === "start" ? (
        <span className="w-14 shrink-0 text-[11px] font-mono text-muted-foreground md:w-16">
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          "relative flex h-7 min-w-0 items-stretch overflow-hidden rounded-md border bg-background/50 transition-all",
          labelPosition === "start" ? "flex-1" : "w-full flex-1",
          hasValue
            ? "border-primary/40 shadow-[var(--chrome-filter-tile-shadow-selected)]"
            : "border-border/50"
        )}
      >
        <div className="flex h-full min-h-0 w-10 shrink-0 items-center justify-center border-r border-border/50 bg-muted/60">          <Select value={value?.operator ?? "eq"} onValueChange={handleOperatorChange}>
            <SelectTrigger
              size="sm"
              hideIcon
              compactValue
              className={cn(
                "flex h-full min-h-0 w-full !items-center !justify-center gap-0 rounded-none border-0 bg-transparent p-0 shadow-none",
                "text-center text-[11px] font-mono normal-case leading-none tracking-normal",
                "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                "[&>[data-slot=select-value]]:block [&>[data-slot=select-value]]:text-center [&>[data-slot=select-value]]:tabular-nums"
              )}
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
        </div>

        <input
          type="number"
          className={cn(
            "min-h-0 min-w-0 flex-1 border-0 bg-transparent px-2 py-0 text-[11px] font-mono leading-none outline-none placeholder:text-muted-foreground/50 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            labelPosition === "end" && "pr-1.5"
          )}
          value={value?.value ?? ""}
          onChange={handleValueChange}
          placeholder=""
          aria-label={labelPosition === "end" ? label : undefined}
        />
        {labelPosition === "end" ? (
          <span
            className="flex h-full shrink-0 items-center border-l border-border/50 bg-muted/60 px-2.5 text-[11px] font-mono leading-none text-muted-foreground"
            aria-hidden
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
