"use client";

import Link from "next/link";
import { COLOR_SCHEMES } from "@/lib/theme";
import type { ColorPresetChoice } from "@/lib/theme/appearance-types";
import { Check, ChevronDown, Moon, Palette, Settings, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfilePreferencesSection() {
  const {
    isDark,
    colorPreset,
    isCustomAppearance,
    applyColorPreset,
    handleToggleTheme,
    handleSettingsClick,
    closeSheet,
  } = useMobileProfileSheetContext();

  const selectedLabel = isCustomAppearance
    ? "Custom"
    : (COLOR_SCHEMES.find((scheme) => scheme.value === colorPreset)?.label ?? "Default");

  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preferences
      </p>
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Palette className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">Color preset</span>
              <span className="max-w-[9rem] truncate text-xs font-normal text-muted-foreground">
                {selectedLabel}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            {COLOR_SCHEMES.map((scheme) => {
              const picked = !isCustomAppearance && scheme.value === colorPreset;
              return (
                <DropdownMenuItem
                  key={scheme.value}
                  className="min-h-11"
                  onClick={() => applyColorPreset(scheme.value as ColorPresetChoice)}
                >
                  <span className="flex-1">{scheme.label}</span>
                  {picked ? (
                    <Check className="ml-auto h-3.5 w-3.5 text-primary" aria-hidden />
                  ) : (
                    <span className="ml-auto w-3.5" aria-hidden />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="min-h-11">
              <Link href="/settings#appearance" onClick={closeSheet}>
                Custom colors…
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={handleSettingsClick}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
