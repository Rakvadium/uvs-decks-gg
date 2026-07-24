"use client";

import Image from "next/image";
import { FilterX, X } from "lucide-react";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { getCardTypeChipColor, getKeywordTimingColor } from "@/config/universus";
import { cn } from "@/lib/utils";
import { useGalleryTopBarFiltersContext } from "../context";
import { StatsQuickFilterAdornment } from "../stats-quick-filter-adornment";
import {
  summarizeTokenValues,
  useActiveFilterTokens,
  type ActiveFilterToken,
} from "./use-active-filter-tokens";

const colorChipClassName =
  "inline-flex max-w-[6.5rem] shrink-0 items-center truncate rounded-sm px-1.5 py-px text-[10px] font-bold font-mono uppercase tracking-[0.08em]";

function TokenColorChips({
  values,
  getColor,
  maxVisible = 3,
}: {
  values: string[];
  getColor: (value: string) => string;
  maxVisible?: number;
}) {
  const shown = values.slice(0, maxVisible);
  const rest = values.length - shown.length;

  return (
    <span className="flex min-w-0 shrink-0 items-center gap-0.5">
      {shown.map((value) => {
        const color = getColor(value);

        return (
          <span
            key={value}
            className={colorChipClassName}
            title={value}
            style={{
              backgroundColor: `${color}4D`,
              color: `color-mix(in oklch, ${color} 62%, var(--foreground) 38%)`,
              border: `1px solid ${color}90`,
            }}
          >
            {value}
          </span>
        );
      })}
      {rest > 0 ? (
        <span className="shrink-0 text-[10px] font-mono text-muted-foreground">+{rest}</span>
      ) : null}
    </span>
  );
}

function TokenSymbolIcons({
  symbols,
  excludesInfinity,
  maxVisible = 6,
}: {
  symbols: string[];
  excludesInfinity: boolean;
  maxVisible?: number;
}) {
  const shown = symbols.slice(0, maxVisible);
  const rest = symbols.length - shown.length;

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {shown.map((symbol) => {
        const path = getSymbolPath(symbol);
        const isAttuned = symbol.startsWith("attuned:");

        return (
          <span
            key={symbol}
            title={symbol}
            className={cn(
              "relative flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden border border-border/50 bg-background",
              isAttuned ? "rounded-none" : "rounded-full"
            )}
          >
            {path ? (
              <Image
                src={path}
                alt={symbol}
                width={16}
                height={16}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="max-w-full truncate px-0.5 text-[8px] leading-none text-muted-foreground">
                {symbol.slice(0, 2)}
              </span>
            )}
          </span>
        );
      })}
      {rest > 0 ? (
        <span className="shrink-0 text-[10px] font-mono text-muted-foreground">+{rest}</span>
      ) : null}
      {excludesInfinity ? (
        <span className="shrink-0 pl-0.5 text-[10px] font-mono text-primary">no ∞</span>
      ) : null}
    </span>
  );
}

function TokenContent({ token }: { token: ActiveFilterToken }) {
  const { filters } = useGalleryFilterDialogContext();

  if (token.id === "type") {
    return <TokenColorChips values={filters.type ?? []} getColor={getCardTypeChipColor} />;
  }

  if (token.id === "keywords") {
    return <TokenColorChips values={filters.keywords ?? []} getColor={getKeywordTimingColor} />;
  }

  if (token.id === "symbols") {
    return (
      <TokenSymbolIcons
        symbols={filters.symbols ?? []}
        excludesInfinity={filters.includeInfinity === false}
      />
    );
  }

  if (token.id === "stats") {
    return (
      <span className="flex min-w-0 items-center overflow-hidden [&>span]:flex-nowrap [&>span]:justify-start">
        <StatsQuickFilterAdornment filters={filters} />
      </span>
    );
  }

  return (
    <span className="min-w-0 truncate text-[11px] leading-none text-primary">
      {summarizeTokenValues(token.values)}
    </span>
  );
}

export function FilterTokens({
  className,
  centered = false,
}: {
  className?: string;
  centered?: boolean;
}) {
  const tokens = useActiveFilterTokens();
  const { setFilterPanelOpen } = useGalleryTopBarFiltersContext();
  const { actions } = useGalleryFilterDialogContext();

  if (tokens.length === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-1.5",
        centered && "justify-center",
        className
      )}
    >
      {tokens.map((token) => (
        <span
          key={token.id}
          className={cn(
            "inline-flex h-6 max-w-[28rem] items-stretch overflow-hidden rounded-md",
            "border border-[color:var(--control-dual-border-strong)]",
            "bg-[color-mix(in_oklch,var(--primary)_9%,var(--popover))]",
            "shadow-[0_2px_8px_rgba(0,0,0,0.35),0_0_14px_-6px_color-mix(in_oklch,var(--secondary)_40%,transparent)]",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          <button
            type="button"
            className="flex min-w-0 items-center gap-1.5 px-2 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--control-dual-ring)]"
            onClick={() => setFilterPanelOpen(true)}
            title={token.values.join(", ")}
          >
            <span className="shrink-0 select-none font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {token.label}
            </span>
            <TokenContent token={token} />
          </button>
          <button
            type="button"
            className="flex w-5 shrink-0 items-center justify-center border-l border-[color:var(--control-dual-border)] text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--control-dual-ring)]"
            aria-label={`Clear ${token.label.toLowerCase()} filter`}
            onClick={token.clear}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {tokens.length > 1 ? (
        <button
          type="button"
          className="inline-flex h-6 items-center gap-1 rounded-md border border-[color:var(--control-dual-border)] bg-popover/95 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-colors hover:border-destructive/50 hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--control-dual-ring)]"
          onClick={actions.clearAllFilters}
        >
          <FilterX className="size-3.5" />
          Clear all
        </button>
      ) : null}
    </div>
  );
}
