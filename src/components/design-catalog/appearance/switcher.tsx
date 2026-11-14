"use client";

import type { ReactNode } from "react";
import { Link2, Moon, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHROME_OPTIONS, COLOR_PRESET_OPTIONS } from "@/providers/ColorSchemeProvider";
import type { ChromeVariant, ColorTheme } from "@/lib/theme/appearance-types";
import { cn } from "@/lib/utils";
import { CopyButton } from "../specimen/code-block";
import { useCatalogAppearance } from "./context";
import type { CatalogMode } from "./params";
import { NEUTRAL_SEGMENT } from "../chrome-tone";

export const CUSTOM_PALETTE_LABEL = "Custom palette (from your account)";

/**
 * Half primary, half secondary. With an `id` it paints in that preset (the theme CSS scopes to
 * `data-color-theme`); without one it inherits `<html>`, which is how a custom palette shows.
 */
export function PresetDot({ id, dark, className }: { id?: string; dark: boolean; className?: string }) {
  return (
    <span
      data-color-theme={id}
      aria-hidden
      className={cn(
        id && dark && "dark",
        "inline-flex size-3.5 shrink-0 overflow-hidden rounded-full border border-hairline",
        className,
      )}
    >
      <span className="h-full w-1/2 bg-primary" />
      <span className="h-full w-1/2 bg-secondary" />
    </span>
  );
}

/**
 * Sizes a select trigger to its longest option, in the current chrome's casing and tracking, so a
 * label never truncates and the header doesn't shift when the value changes. The hidden copies
 * share one grid cell with the live value.
 */
function WidestValue({ options, children }: { options: ReactNode[]; children: ReactNode }) {
  return (
    <span className="grid min-w-0 items-center">
      {options.map((option, index) => (
        <span key={index} aria-hidden className="invisible col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap">
          {option}
        </span>
      ))}
      <span className="col-start-1 row-start-1 flex min-w-0 items-center whitespace-nowrap *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2">
        {children}
      </span>
    </span>
  );
}

const MODE_ITEMS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * Theme × mode × chrome for this page only, inline in the desktop header (phones use
 * `AppearanceSheet`). Every control writes the URL and `<html>` through `useCatalogAppearance`;
 * none of them touches the saved session.
 */
export function AppearanceSwitcher({ className }: { className?: string }) {
  const { current, set } = useCatalogAppearance();
  const dark = current.mode === "dark";
  const custom = current.rawTheme === "custom";
  const themeValue = custom ? "custom" : current.theme;
  const presetLabels = [...(custom ? [CUSTOM_PALETTE_LABEL] : []), ...COLOR_PRESET_OPTIONS.map((preset) => preset.label)];

  return (
    <div className={cn("flex items-center gap-2", className)} role="group" aria-label="Catalog appearance (this page only)">
      <Select value={themeValue} onValueChange={(value) => set({ theme: value as ColorTheme })}>
        <SelectTrigger size="sm" aria-label="Color preset">
          <WidestValue
            options={presetLabels.map((label) => (
              <>
                <PresetDot dark={dark} />
                {label}
              </>
            ))}
          >
            <SelectValue />
          </WidestValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {custom ? (
            <SelectItem value="custom" disabled>
              {CUSTOM_PALETTE_LABEL}
            </SelectItem>
          ) : null}
          {COLOR_PRESET_OPTIONS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <PresetDot id={preset.id} dark={dark} />
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <SegmentedControl
        size="sm"
        value={current.mode}
        onValueChange={(value) => set({ mode: value as CatalogMode })}
        className="shrink-0"
        itemClassName={NEUTRAL_SEGMENT}
        items={MODE_ITEMS}
      />

      <Select value={current.chrome} onValueChange={(value) => set({ chrome: value as ChromeVariant })}>
        <SelectTrigger size="sm" aria-label="Chrome">
          <WidestValue options={CHROME_OPTIONS.map((chrome) => chrome.label)}>
            <SelectValue />
          </WidestValue>
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {CHROME_OPTIONS.map((chrome) => (
            <SelectItem key={chrome.id} value={chrome.id}>
              {chrome.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Copy-a-link and reset, icon-only beside the desktop switcher. */
export function AppearanceLinkActions({ className }: { className?: string }) {
  const { current, pinned, reset, hrefWith } = useCatalogAppearance();
  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <CopyButton
              value={() => new URL(hrefWith({ ...current, focus: undefined }), window.location.origin).toString()}
              label="Copy a link to this theme"
              icon={<Link2 />}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>Copy link to this theme</TooltipContent>
      </Tooltip>
      {pinned ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Follow the app's appearance again" onClick={reset} className="shrink-0">
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Follow the app&apos;s appearance</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
