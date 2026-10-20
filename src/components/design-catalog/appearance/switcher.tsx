"use client";

import { Link2, Moon, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHROME_OPTIONS, COLOR_PRESET_OPTIONS } from "@/providers/ColorSchemeProvider";
import type { ChromeVariant, ColorPresetChoice } from "@/lib/theme/appearance-types";
import { cn } from "@/lib/utils";
import { CopyButton } from "../specimen/code-block";
import { useCatalogAppearance } from "./context";
import type { CatalogMode } from "./params";

function PresetDot({ id, dark }: { id: string; dark: boolean }) {
  return (
    <span
      data-color-theme={id}
      aria-hidden
      className={cn(dark && "dark", "inline-flex size-3.5 shrink-0 overflow-hidden rounded-full border border-hairline")}
    >
      <span className="h-full w-1/2 bg-primary" />
      <span className="h-full w-1/2 bg-secondary" />
    </span>
  );
}

/**
 * Theme × mode × chrome for this page only. Every control writes the URL and `<html>` through
 * `useCatalogAppearance`; none of them touches the saved session.
 */
export function AppearanceSwitcher({ className }: { className?: string }) {
  const { current, set } = useCatalogAppearance();
  const dark = current.mode === "dark";
  const themeValue = current.rawTheme === "custom" ? "custom" : current.theme;

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} role="group" aria-label="Catalog appearance (this page only)">
      <Select value={themeValue} onValueChange={(value) => set({ theme: value as ColorPresetChoice })}>
        <SelectTrigger size="sm" aria-label="Color preset" className="min-w-0 flex-[3] sm:w-44 sm:flex-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {current.rawTheme === "custom" ? (
            <SelectItem value="custom" disabled>
              Custom palette (from your account)
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
        items={[
          { value: "light", label: <span className="sr-only sm:not-sr-only">Light</span>, icon: Sun },
          { value: "dark", label: <span className="sr-only sm:not-sr-only">Dark</span>, icon: Moon },
        ]}
      />

      <Select value={current.chrome} onValueChange={(value) => set({ chrome: value as ChromeVariant })}>
        <SelectTrigger size="sm" aria-label="Chrome" className="min-w-0 flex-[2] sm:w-36 sm:flex-none">
          <SelectValue />
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

/** Copy-a-link and reset, kept apart from the selects so phones can give the selects the full row. */
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
