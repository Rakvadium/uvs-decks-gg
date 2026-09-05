"use client";

import Link from "next/link";
import { COLOR_SCHEMES } from "@/lib/theme";
import type { ColorPresetChoice } from "@/lib/theme/appearance-types";
import { Check, ChevronRight, Moon, Palette, Settings, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ShellFeedbackNav } from "@/components/shell/shell-feedback-nav";
import { MOBILE_INSET_DIVIDER, MOBILE_INSET_GROUP, MOBILE_INSET_ROW } from "../mobile-glass";
import { MobileProfileSectionLabel } from "./section-label";
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
    <section>
      <MobileProfileSectionLabel>Appearance</MobileProfileSectionLabel>
      <div className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER)}>
        <label className={cn(MOBILE_INSET_ROW, "cursor-pointer")}>
          {isDark ? (
            <Moon className="size-5 text-muted-foreground" aria-hidden />
          ) : (
            <Sun className="size-5 text-muted-foreground" aria-hidden />
          )}
          <span className="flex-1 font-medium">Dark mode</span>
          <Switch checked={isDark} onCheckedChange={handleToggleTheme} aria-label="Toggle dark mode" />
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={MOBILE_INSET_ROW}>
              <Palette className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1 font-medium">Color preset</span>
              <span className="max-w-[9rem] truncate text-sm text-muted-foreground">{selectedLabel}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            {COLOR_SCHEMES.map((scheme) => {
              const picked = !isCustomAppearance && scheme.value === colorPreset;
              return (
                <DropdownMenuItem
                  key={scheme.value}
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
            <DropdownMenuItem asChild>
              <Link href="/settings#appearance" onClick={closeSheet}>
                Custom colors…
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button type="button" onClick={handleSettingsClick} className={MOBILE_INSET_ROW}>
          <Settings className="size-5 text-muted-foreground" aria-hidden />
          <span className="flex-1 font-medium">Settings</span>
          <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
        </button>
      </div>

      <div className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER, "mt-5")}>
        <ShellFeedbackNav variant="profile-sheet" onAfterOpen={closeSheet} />
      </div>
    </section>
  );
}
