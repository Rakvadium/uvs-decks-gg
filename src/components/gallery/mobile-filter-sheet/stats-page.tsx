"use client";

import { Minus, Plus, X } from "lucide-react";
import type { StatOperator } from "@/providers/UIStateProvider";
import { cn } from "@/lib/utils";
import { OPERATOR_OPTIONS, ZONE_OPTIONS } from "../filter-dialog/constants";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";
import type { StatFilterKey } from "../filter-dialog/types";
import { FilterChip, FilterChipRow, FilterGroup, FilterRow } from "./primitives";
import { OPERATOR_GLYPHS, STAT_LABELS } from "./use-active-chips";

const stepperButtonClassName =
  "flex size-10 shrink-0 items-center justify-center text-foreground transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 motion-safe:active:scale-90 motion-safe:transition-[color,background-color,transform]";

function StatRule({ filterKey }: { filterKey: StatFilterKey }) {
  const { filters, setStatFilter } = useGalleryFilterDialogContext();
  const value = filters[filterKey];
  const isActive = value?.value !== undefined;
  const operator = value?.operator ?? "eq";
  const amount = value?.value ?? 0;
  const label = STAT_LABELS[filterKey];

  const setOperator = (next: StatOperator) => {
    setStatFilter(filterKey, { operator: next, value: amount });
  };

  const setAmount = (next: number) => {
    setStatFilter(filterKey, { operator, value: next });
  };

  return (
    <FilterRow className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("text-sm font-medium", isActive ? "text-primary" : "text-foreground")}>{label}</span>
        {isActive ? (
          <button
            type="button"
            onClick={() => setStatFilter(filterKey, undefined)}
            aria-label={`Clear ${label} rule`}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">Any</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div
          role="radiogroup"
          aria-label={`${label} comparison`}
          className="flex h-10 min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-border/50 bg-muted/30"
        >
          {OPERATOR_OPTIONS.map((option, index) => {
            const selected = isActive && operator === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.label}
                onClick={() => setOperator(option.value)}
                className={cn(
                  "min-w-0 flex-1 text-sm tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  index !== 0 && "border-l border-border/40",
                  selected ? "bg-primary/20 font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {OPERATOR_GLYPHS[option.value]}
              </button>
            );
          })}
        </div>
        <div
          className={cn(
            "flex h-10 shrink-0 items-stretch overflow-hidden rounded-lg border bg-background/60",
            isActive ? "border-primary/50" : "border-border/50"
          )}
        >
          <button
            type="button"
            onClick={() => setAmount(amount - 1)}
            aria-label={`Decrease ${label}`}
            className={stepperButtonClassName}
          >
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            aria-label={`${label} value`}
            value={isActive ? amount : ""}
            placeholder="–"
            onChange={(event) => {
              const parsed = parseInt(event.target.value, 10);
              if (Number.isNaN(parsed)) {
                setStatFilter(filterKey, undefined);
                return;
              }
              setAmount(parsed);
            }}
            className="w-10 min-w-0 border-x border-border/40 bg-transparent text-center text-base tabular-nums outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setAmount(amount + 1)}
            aria-label={`Increase ${label}`}
            className={stepperButtonClassName}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </FilterRow>
  );
}

function ZoneRule({ filterKey, label }: { filterKey: "blockZone" | "attackZone"; label: string }) {
  const { filters, toggleStringFilter } = useGalleryFilterDialogContext();
  const selected = filters[filterKey] ?? [];

  return (
    <FilterRow>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <FilterChipRow>
        {ZONE_OPTIONS.map((zone) => (
          <FilterChip
            key={zone}
            label={zone}
            selected={selected.includes(zone)}
            onClick={() => toggleStringFilter(filterKey, zone)}
          />
        ))}
      </FilterChipRow>
    </FilterRow>
  );
}

export function GalleryMobileFilterStatsPage() {
  return (
    <div className="space-y-5 px-4 pb-4 pt-3">
      <FilterGroup label="General">
        <StatRule filterKey="difficulty" />
        <StatRule filterKey="control" />
        <StatRule filterKey="health" />
        <StatRule filterKey="handSize" />
        <StatRule filterKey="stamina" />
      </FilterGroup>
      <FilterGroup label="Block">
        <ZoneRule filterKey="blockZone" label="Zone" />
        <StatRule filterKey="blockModifier" />
      </FilterGroup>
      <FilterGroup label="Attack">
        <ZoneRule filterKey="attackZone" label="Zone" />
        <StatRule filterKey="speed" />
        <StatRule filterKey="damage" />
      </FilterGroup>
    </div>
  );
}
