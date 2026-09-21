"use client";

import Image from "next/image";
import { FilterX, X } from "lucide-react";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { getCardTypeChipColor, getKeywordTimingColor } from "@/config/universus";
import { floatingIslandRingClassName } from "@/components/shell/floating-island";
import { cn } from "@/lib/utils";
import type { GalleryMobileFilterPage } from "@/components/gallery/mobile-filter-sheet/context";
import { useGalleryTopBarFiltersContext } from "../context";
import {
  summarizeTokenValues,
  useActiveFilterTokens,
  type ActiveFilterToken,
} from "./use-active-filter-tokens";

const TOKEN_PAGE: Record<string, GalleryMobileFilterPage> = {
  format: "format",
  includeBanned: "format",
  set: "sets",
  sets: "sets",
  type: "type",
  symbols: "symbols",
  keywords: "keywords",
  stats: "stats",
  rarity: "rarity",
};

const colorChipClassName =
  "chrome-label-case inline-flex max-w-[6.5rem] shrink-0 items-center truncate rounded-md px-1.5 py-px text-[10px] font-bold";

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
        <span className="shrink-0 text-[10px] text-muted-foreground">+{rest}</span>
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
              <span className="max-w-full truncate px-0.5 text-[10px] leading-none text-muted-foreground">
                {symbol.slice(0, 2)}
              </span>
            )}
          </span>
        );
      })}
      {rest > 0 ? (
        <span className="shrink-0 text-[10px] text-muted-foreground">+{rest}</span>
      ) : null}
      {excludesInfinity ? (
        <span className="shrink-0 pl-0.5 text-[10px] text-primary">no ∞</span>
      ) : null}
    </span>
  );
}

function TokenContent({ token }: { token: ActiveFilterToken }) {
  const { filters } = useGalleryFilterDialogContext();

  if (!token.active) {
    return (
      <span className="min-w-0 truncate text-[11px] leading-none text-muted-foreground">
        {token.values[0] ?? "Any"}
      </span>
    );
  }

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

  if (token.id === "sets" || token.id === "stats" || token.id === "rarity") {
    const selectedLabel = token.count === 1 ? "1 selected" : `${token.count} selected`;
    return (
      <span className="min-w-0 truncate text-[11px] leading-none text-primary">
        {selectedLabel}
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
  const { openFilterPanel } = useGalleryTopBarFiltersContext();
  const { actions } = useGalleryFilterDialogContext();
  const hasActiveToken = tokens.some((token) => token.active);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        centered && "[justify-content:safe_center]",
        className
      )}
    >
      {tokens.map((token) => (
        <span
          key={token.id}
          className={cn(
            "inline-flex max-w-[28rem] shrink-0 rounded-full p-px shadow-[var(--chrome-floating-shadow)] focus-within:shadow-[var(--chrome-floating-shadow-focus)]",
            floatingIslandRingClassName
          )}
        >
          <span
            className={cn(
              "inline-flex min-w-0 items-stretch overflow-hidden rounded-full backdrop-blur-xl",
              token.active ? "bg-primary/10" : "bg-background/80"
            )}
          >
            <button
              type="button"
              data-gallery-filter-panel-trigger=""
              className={cn(
                "flex h-6 min-w-0 items-center gap-1.5 px-2.5 transition-colors duration-150 focus-visible:outline-none",
                token.active ? "hover:bg-primary/20" : "hover:bg-muted/60"
              )}
              onClick={() => openFilterPanel(TOKEN_PAGE[token.id] ?? "root")}
              aria-label={`Edit ${token.label} filter`}
              title={token.values.join(", ")}
            >
              <span className="chrome-label-case shrink-0 select-none text-[10px] font-bold text-muted-foreground">
                {token.label}
              </span>
              <TokenContent token={token} />
            </button>
            {token.active ? (
              <button
                type="button"
                className="flex h-6 w-5 shrink-0 items-center justify-center border-l border-border/30 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none"
                aria-label={`Clear ${token.label.toLowerCase()} filter`}
                onClick={token.clear}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </span>
        </span>
      ))}
      {hasActiveToken ? (
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full p-px shadow-[var(--chrome-floating-shadow)] focus-within:shadow-[var(--chrome-floating-shadow-focus)]",
            floatingIslandRingClassName
          )}
        >
          <button
            type="button"
            className="chrome-label-case inline-flex h-6 items-center gap-1 rounded-full bg-background/80 px-2.5 text-[10px] text-muted-foreground backdrop-blur-xl transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none"
            onClick={actions.clearAllFilters}
          >
            <FilterX className="size-3.5" />
            Clear all
          </button>
        </span>
      ) : null}
    </div>
  );
}
