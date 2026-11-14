"use client";

import type { ReactNode } from "react";
import { Check, Link2, Moon, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Kicker } from "@/components/ui/typography-headings";
import { CHROME_OPTIONS, COLOR_PRESET_OPTIONS } from "@/providers/ColorSchemeProvider";
import { cn } from "@/lib/utils";
import { CopyButton } from "../specimen/code-block";
import { useCatalogAppearance } from "./context";
import type { CatalogMode } from "./params";
import { CUSTOM_PALETTE_LABEL, PresetDot } from "./switcher";
import { NEUTRAL_OUTLINE, NEUTRAL_SEGMENT } from "../chrome-tone";

/** A labelled set of pressable options, two per row, for thumbs rather than a nested select. */
function OptionGrid<T extends string>({
  legend,
  options,
  value,
  onSelect,
}: {
  legend: string;
  options: { id: T; label: string; leading?: ReactNode }[];
  value: string;
  onSelect: (id: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2">
        <Kicker>{legend}</Kicker>
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary-strong bg-primary-wash text-foreground" : "border-surface bg-card text-foreground hover:bg-muted-soft",
              )}
            >
              {option.leading}
              <span className="chrome-label-case min-w-0 flex-1 break-words">{option.label}</span>
              {active ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Phones and tablets: preset, mode and chrome behind one header button, so the sticky header
 * stays a single row. Same page-only pins as the desktop switcher; nothing reaches the session.
 */
export function AppearanceSheet() {
  const { current, pinned, set, reset, hrefWith } = useCatalogAppearance();
  const dark = current.mode === "dark";
  const custom = current.rawTheme === "custom";
  const presetLabel = custom
    ? "custom palette"
    : (COLOR_PRESET_OPTIONS.find((preset) => preset.id === current.theme)?.label ?? current.theme);
  const chromeLabel = CHROME_OPTIONS.find((chrome) => chrome.id === current.chrome)?.label ?? current.chrome;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={NEUTRAL_OUTLINE} aria-label={`Theme: ${presetLabel}, ${current.mode}, ${chromeLabel} chrome`}>
          <PresetDot id={custom ? undefined : current.theme} dark={dark} />
          {dark ? <Moon /> : <Sun />}
          {/* Phones: the dot and mode icon carry it; the label (and full value) is in aria-label. */}
          <span className="max-sm:sr-only">Theme</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto p-0">
        <SheetHeader className="space-y-1 border-b border-hairline p-4 pr-12 text-left">
          <SheetTitle>Theme</SheetTitle>
          <SheetDescription>
            This page only. Nothing is saved to your account; leaving restores your own appearance.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 p-4">
          {custom ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <PresetDot dark={dark} />
              {CUSTOM_PALETTE_LABEL}. Pick a preset to compare.
            </p>
          ) : null}
          <OptionGrid
            legend="Color preset"
            value={custom ? "custom" : current.theme}
            onSelect={(theme) => set({ theme })}
            options={COLOR_PRESET_OPTIONS.map((preset) => ({
              id: preset.id,
              label: preset.label,
              leading: <PresetDot id={preset.id} dark={dark} />,
            }))}
          />
          <fieldset className="space-y-2">
            <legend className="mb-2">
              <Kicker>Mode</Kicker>
            </legend>
            <SegmentedControl
              stretch
              itemClassName={NEUTRAL_SEGMENT}
              value={current.mode}
              onValueChange={(mode) => set({ mode: mode as CatalogMode })}
              items={[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
              ]}
            />
          </fieldset>
          <OptionGrid
            legend="Chrome"
            value={current.chrome}
            onSelect={(chrome) => set({ chrome })}
            options={CHROME_OPTIONS.map((chrome) => ({ id: chrome.id, label: chrome.label }))}
          />
        </div>
        <SheetFooter className="flex-row flex-wrap gap-2 border-t border-hairline p-4 sm:justify-start sm:space-x-0">
          <CopyButton
            value={() => new URL(hrefWith({ ...current, focus: undefined }), window.location.origin).toString()}
            icon={<Link2 />}
            className={NEUTRAL_OUTLINE}
          >
            Copy link
          </CopyButton>
          {pinned ? (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              Follow the app&apos;s appearance
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
