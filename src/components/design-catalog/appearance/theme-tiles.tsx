"use client";

import { Check } from "lucide-react";
import { COLOR_PRESET_OPTIONS } from "@/providers/ColorSchemeProvider";
import { cn } from "@/lib/utils";
import { useCatalogAppearance } from "./context";

/**
 * One tile per preset. Each tile carries its own `data-color-theme` (and `.dark`), which the theme
 * CSS scopes to, so it paints in that preset no matter which one the page is pinned to.
 */
export function ThemeTiles() {
  const { current, set } = useCatalogAppearance();

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Color presets">
      {COLOR_PRESET_OPTIONS.map((preset) => {
        const active = current.rawTheme === preset.id;
        return (
          <li key={preset.id}>
            <button
              type="button"
              aria-pressed={active}
              aria-label={`${preset.label} preset`}
              onClick={() => set({ theme: preset.id })}
              className="group/tile block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                data-color-theme={preset.id}
                className={cn(
                  current.mode === "dark" && "dark",
                  "block overflow-hidden rounded-xl border bg-background text-foreground transition-[border-color,box-shadow] duration-150",
                  active
                    ? "border-primary shadow-[0_0_0_1px_var(--primary),var(--chrome-elevation-mid)]"
                    : "border-surface shadow-[var(--chrome-elevation-low)] group-hover/tile:border-primary-strong",
                )}
              >
                <span className="grid h-20 grid-cols-[2fr_1fr_1fr]" aria-hidden>
                  <span className="flex items-end bg-primary p-2.5 text-primary-foreground">
                    <span className="text-xl font-semibold leading-none">Aa</span>
                  </span>
                  <span className="bg-secondary" />
                  <span className="grid grid-rows-2">
                    <span className="bg-accent" />
                    <span className="bg-muted" />
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2 bg-card px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-card-foreground">{preset.label}</span>
                    <span className="block truncate text-[11px] normal-case tracking-normal text-muted-foreground">
                      {preset.id}
                    </span>
                  </span>
                  {active ? (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" aria-hidden />
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
